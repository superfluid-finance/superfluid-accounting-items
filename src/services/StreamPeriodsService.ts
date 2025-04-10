import { fromUnixTime, getUnixTime, startOfMonth } from 'date-fns';
import Decimal from 'decimal.js';
import { formatEther } from 'ethers/lib/utils';
import flatten from 'lodash/fp/flatten';
import { TimespanPrice } from '../utils/CoingeckoApi';
import { CurrencyCode } from '../utils/CurrencyUtils';
import { getEndOfPeriodTimestamp, UnitOfTime } from '../utils/DateUtils';
import { Network } from '../utils/Network';
import { queryStreamPeriods as queryStreamPeriodsAndTransfers } from '../utils/SubgraphApi';
import { Address, StreamPeriod, StreamPeriodResult, Token, TransferEventResult, TransferEventResultWithToken, VirtualStreamPeriod } from '../utils/Types';
import { getTokensPrices, NetworkToken } from './TokenPriceService';
import maxBy from 'lodash/fp/maxBy';
import { uniqBy } from 'lodash';

export async function getVirtualizedStreamPeriods(
	addresses: Address[],
	networks: Network[],
	startTimestamp: number = getUnixTime(startOfMonth(Date.now())),
	endTimestamp: number = getUnixTime(Date.now()),
	period: UnitOfTime,
	counterpartyAddresses: Address[],
	currency: CurrencyCode,
	priceGranularity: UnitOfTime,
): Promise<StreamPeriod[]> {
	// Fetch all stream periods
	const networksStreamPeriodsAndTransfers = await Promise.all(
		networks.map((network) =>
			queryStreamPeriodsAndTransfers(addresses, network, startTimestamp, endTimestamp, counterpartyAddresses),
		),
	);

	const streamPeriods = flatten(networksStreamPeriodsAndTransfers.map(({ streamPeriods }) => streamPeriods));
	const transfers = flatten(networksStreamPeriodsAndTransfers.map(({ transfers }) => transfers));

	const uniqueTokens = getUniqueNetworkTokenAddresses({ streamPeriods, transfers });
	const tokensWithPriceData = await getTokensPrices(
		uniqueTokens,
		currency,
		priceGranularity,
		startTimestamp,
		endTimestamp,
	);

	const transfersAsStreamPeriods: StreamPeriodResult[] = transfers.map((transfer) => ({
		__typename: "TransferEvent",
		id: transfer.id,
		token: transfer.token,
		flowRate: "0",
		chainId: transfer.chainId,
		sender: transfer.from,
		receiver: transfer.to,
		startedAtTimestamp: transfer.timestamp,
		startedAtBlockNumber: transfer.blockNumber,
		startedAtEvent: {
			transactionHash: transfer.transactionHash,
		},
		stoppedAtTimestamp: transfer.timestamp,
		stoppedAtBlockNumber: transfer.blockNumber,
		stoppedAtEvent: {
			transactionHash: transfer.transactionHash,
		},
		totalAmountStreamed: transfer.value
	}));

	const streamPeriodsAndTransfers = [...streamPeriods, ...transfersAsStreamPeriods];

	// Map stream periods into virtualized periods based on conf
	const virtualizedStreamPeriods = streamPeriodsAndTransfers.map((streamPeriod) => {
		const tokenPriceData = tokensWithPriceData.find(
			(tokenWithPriceData) =>
				tokenWithPriceData.chainId === streamPeriod.chainId &&
				tokenWithPriceData.token.toLowerCase() === streamPeriod.token.underlyingAddress.toLowerCase(),
		);

		const virtualPeriods = virtualizeStreamPeriod(
			addresses,
			streamPeriod,
			fromUnixTime(startTimestamp),
			fromUnixTime(endTimestamp),
			period,
			tokenPriceData?.prices || [],
		).filter(x => {
			// Possible fix for old entries showing up.
			return x.startTime >= startTimestamp && x.endTime <= endTimestamp;
		});

		return mapStreamPeriodResult(streamPeriod, virtualPeriods);
	});

	return virtualizedStreamPeriods;
}

function mapStreamPeriodResult(streamPeriod: StreamPeriodResult, virtualPeriods: VirtualStreamPeriod[]) {
	const {
		sender,
		receiver,
		startedAtEvent,
		stoppedAtEvent,
		__typename,
		token: { __typename: _tokenType, ...tokenRest },
		...rest
	} = streamPeriod;

	return {
		...rest,
		token: tokenRest,
		sender: sender.id,
		receiver: receiver.id,
		startedAtEvent: startedAtEvent.transactionHash,
		stoppedAtEvent: stoppedAtEvent?.transactionHash,
		virtualPeriods,
	};
}

/**
 * Recursive function to virtualize stream period in different time spans. (Daily, Weekly, Monthly etc.)
 * Amounts are calculated based on the overlapping period of date filter, stream period and virtualized period.
 */
function virtualizeStreamPeriod(
	addresses: Address[],
	streamPeriod: StreamPeriodResult,
	startDate: Date,
	endDate: Date,
	period: UnitOfTime,
	priceData: TimespanPrice[],
): Array<VirtualStreamPeriod> {
	const { flowRate, startedAtTimestamp, stoppedAtTimestamp } = streamPeriod;

	const streamStoppedTimestamp = stoppedAtTimestamp || getUnixTime(Date.now());
	const endTimestamp = Math.min(getUnixTime(endDate), streamStoppedTimestamp);

	// Date when stream period and virtual period start overlapping
	const streamPeriodStartTimestamp = Math.max(getUnixTime(startDate), startedAtTimestamp);

	// Virtual period start and end timestamps (start and end timestamps of day, week, month or year)
	const virtualPeriodEndTimestamp = getEndOfPeriodTimestamp(streamPeriodStartTimestamp, period);

	// Timestamp when stream period, virtual period end and end date filter stop overlapping
	const streamPeriodEndTimestamp = Math.min(virtualPeriodEndTimestamp, endTimestamp);

	const isOutgoing = addresses.includes(streamPeriod.sender.id.toLowerCase());
	const amount = getAmountInTimespan(streamPeriodStartTimestamp, streamPeriodEndTimestamp, flowRate);
	const amountFiat = calculateVirtualStreamPeriodPrice(
		streamPeriodStartTimestamp,
		streamPeriodEndTimestamp,
		flowRate,
		priceData,
	);

	const virtualStreamPeriod: VirtualStreamPeriod = {
		startTime: streamPeriodStartTimestamp,
		endTime: streamPeriodEndTimestamp,
		amount: setDecimalSign(amount, isOutgoing).toFixed(),
		amountFiat: setDecimalSign(amountFiat, isOutgoing).toFixed(),
	};

	if (endTimestamp <= virtualPeriodEndTimestamp) return [virtualStreamPeriod];

	const nextPeriodStartDate = fromUnixTime(virtualPeriodEndTimestamp + 1);

	return [
		virtualStreamPeriod,
		...virtualizeStreamPeriod(addresses, streamPeriod, nextPeriodStartDate, endDate, period, priceData),
	];
}

function setDecimalSign(decimal: Decimal, negative: boolean) {
	if ((negative && Decimal.sign(decimal) < 0) || (!negative && Decimal.sign(decimal) > 0)) return decimal;
	return decimal.mul(-1);
}

function getAmountInTimespan(startTimestamp: number, endTimestamp: number, flowRate: string): Decimal {
	return new Decimal(flowRate).mul(new Decimal(endTimestamp - startTimestamp));
}

function getUniqueNetworkTokenAddresses({ streamPeriods, transfers }: { streamPeriods: StreamPeriodResult[], transfers: TransferEventResultWithToken[] }): NetworkToken[] {
	const allTokens = uniqBy([
		...streamPeriods.map((streamPeriod) => ({ ...streamPeriod.token, chainId: streamPeriod.chainId })),
		...transfers.map((transfer) => ({ ...transfer.token, chainId: transfer.chainId }))
	], x => `${x.chainId}-${x.id}`);

	return Object.values(
		allTokens.reduce((tokens, token) => {
			const {
				chainId,
				id,
				underlyingAddress,
			} = token;

			// TODO: If no underlyingAddress then it is native super token?
			return {
				...tokens,
				[`${chainId}-${underlyingAddress}`]: { chainId, token: underlyingAddress || id },
			};
		}, {}),
	);
}

function getPeriodRelevantPriceData(startTimestamp: number, endTimestamp: number, priceData: TimespanPrice[]) {
	const priceWhenPeriodStarts = maxBy(
		(timespanPrice: TimespanPrice) => timespanPrice.start,
		priceData.filter((timespanPrice) => timespanPrice.start <= startTimestamp),
	);

	const priceDataDuringTimePeriod = priceData.filter(
		(timespanPrice) => timespanPrice.start > startTimestamp && timespanPrice.start <= endTimestamp,
	);

	return priceWhenPeriodStarts ? [priceWhenPeriodStarts, ...priceDataDuringTimePeriod] : priceDataDuringTimePeriod;
}

function calculateVirtualStreamPeriodPrice(
	startTimestamp: number,
	endTimestamp: number,
	flowRate: string,
	priceData: TimespanPrice[],
) {
	const relevantPriceData = getPeriodRelevantPriceData(startTimestamp, endTimestamp, priceData);

	return mapPriceDataToVirtualStreamPeriodRecursive(
		new Decimal(0),
		new Decimal(flowRate),
		startTimestamp,
		endTimestamp,
		relevantPriceData,
	);
}

function mapPriceDataToVirtualStreamPeriodRecursive(
	currentTotal: Decimal,
	flowRate: Decimal,
	startTimestamp: number,
	endTimestamp: number,
	priceData: TimespanPrice[],
): Decimal {
	const [timespanPrice, ...remainingPriceData] = priceData;
	const [nextTimespanPrice] = remainingPriceData;

	if (!timespanPrice) return new Decimal(0);

	const start = Math.max(timespanPrice.start, startTimestamp);
	const end = Math.min(nextTimespanPrice ? nextTimespanPrice.start : Infinity, endTimestamp);

	const amountWei = new Decimal(end - start).mul(new Decimal(flowRate));
	const amountEther = new Decimal(formatEther(amountWei.toFixed()).toString());
	const amountFiat = amountEther.mul(new Decimal(timespanPrice.price.toString()));
	const newTotal = currentTotal.add(amountFiat);

	if (!nextTimespanPrice) return newTotal;

	return mapPriceDataToVirtualStreamPeriodRecursive(
		newTotal,
		flowRate,
		startTimestamp,
		endTimestamp,
		remainingPriceData,
	);
}
