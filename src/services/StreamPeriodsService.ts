import { fromUnixTime, getUnixTime, startOfMonth } from 'date-fns';
import Decimal from 'decimal.js';
import { formatEther } from 'ethers/lib/utils';
import flatten from 'lodash/fp/flatten';
import { TimespanPrice } from '../utils/CoingeckoApi';
import { CurrencyCode } from '../utils/CurrencyUtils';
import { getEndOfPeriodTimestamp, UnitOfTime } from '../utils/DateUtils';
import { Network } from '../utils/Network';
import { queryStreamPeriods } from '../utils/SubgraphApi';
import { Address, StreamPeriodResult, VirtualStreamPeriod } from '../utils/Types';
import { getTokensPrices, NetworkToken } from './TokenPriceService';
import maxBy from 'lodash/fp/maxBy';

export async function getVirtualizedStreamPeriods(
	address: Address,
	networks: Network[],
	startTimestamp: number = getUnixTime(startOfMonth(Date.now())),
	endTimestamp: number = getUnixTime(Date.now()),
	period: UnitOfTime,
	counterpartyAddresses: Address[],
	currency: CurrencyCode,
	priceGranularity: UnitOfTime,
) {
	// Fetch all stream periods
	const networksStreamPeriods = await Promise.all(
		networks.map((network) =>
			queryStreamPeriods(address, network, startTimestamp, endTimestamp, counterpartyAddresses),
		),
	);

	const streamPeriods = flatten(networksStreamPeriods);
	const uniqueTokens = getUniqueNetworkTokenAddresses(streamPeriods);

	const tokensWithPriceData = await getTokensPrices(
		uniqueTokens,
		currency,
		priceGranularity,
		startTimestamp,
		endTimestamp,
	);

	// Map stream periods into virtualized periods based on conf
	return streamPeriods.map((streamPeriod) => {
		const tokenPriceData = tokensWithPriceData.find(
			(tokenWithPriceData) =>
				tokenWithPriceData.chainId === streamPeriod.chainId &&
				tokenWithPriceData.token.toLowerCase() === streamPeriod.token.underlyingAddress.toLowerCase(),
		);

		return {
			...streamPeriod,
			virtualPeriods: virtualizeStreamPeriod(
				streamPeriod,
				fromUnixTime(startTimestamp),
				fromUnixTime(endTimestamp),
				period,
				tokenPriceData?.prices || [],
			),
		};
	});
}

/**
 * Recursive function to virtualize stream period in different time spans. (Daily, Weekly, Monthly etc.)
 * Amounts are calculated based on the overlapping period of date filter, stream period and virtualized period.
 */
function virtualizeStreamPeriod(
	streamPeriod: StreamPeriodResult,
	startDate: Date,
	endDate: Date,
	period: UnitOfTime,
	priceData: TimespanPrice[],
) {
	const { flowRate, startedAtTimestamp, stoppedAtTimestamp } = streamPeriod;

	const streamStoppedTimestamp = stoppedAtTimestamp || getUnixTime(Date.now());
	const endTimestamp = Math.min(getUnixTime(endDate), streamStoppedTimestamp);

	// Date when stream period and virtual period start overlapping
	const streamPeriodStartTimestamp = Math.max(getUnixTime(startDate), startedAtTimestamp);

	// Virtual period start and end timestamps (start and end timestamps of day, week, month or year)
	const virtualPeriodEndTimestamp = getEndOfPeriodTimestamp(streamPeriodStartTimestamp, period);

	// Timestamp when stream period, virtual period end and end date filter stop overlapping
	const streamPeriodEndTimestamp = Math.min(virtualPeriodEndTimestamp, endTimestamp);

	const virtualStreamPeriod: VirtualStreamPeriod = {
		startTime: streamPeriodStartTimestamp,
		endTime: streamPeriodEndTimestamp,
		amount: getAmountInTimespan(streamPeriodStartTimestamp, streamPeriodEndTimestamp, flowRate).toString(),
		amountFiat: calculateVirtualStreamPeriodPrice(
			streamPeriodStartTimestamp,
			streamPeriodEndTimestamp,
			flowRate,
			priceData,
		).toString(),
	};

	if (endTimestamp <= virtualPeriodEndTimestamp) return [virtualStreamPeriod];

	const nextPeriodStartDate = fromUnixTime(virtualPeriodEndTimestamp + 1);
	return [
		virtualStreamPeriod,
		...virtualizeStreamPeriod(streamPeriod, nextPeriodStartDate, endDate, period, priceData),
	];
}

function getAmountInTimespan(startTimestamp: number, endTimestamp: number, flowRate: string): Decimal {
	return new Decimal(flowRate).mul(new Decimal(endTimestamp - startTimestamp));
}

function getUniqueNetworkTokenAddresses(streamPeriods: StreamPeriodResult[]): NetworkToken[] {
	return Object.values(
		streamPeriods.reduce((tokens, streamPeriod) => {
			const {
				chainId,
				token: { id, underlyingAddress },
			} = streamPeriod;

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
) {
	const [timespanPrice, ...remainingPriceData] = priceData;
	const [nextTimespanPrice] = remainingPriceData;

	if (!timespanPrice) return new Decimal(0);

	const start = Math.max(timespanPrice.start, startTimestamp);
	const end = Math.min(nextTimespanPrice ? nextTimespanPrice.start : Infinity, endTimestamp);

	const amountWei = new Decimal(end - start).mul(new Decimal(flowRate));
	const amountEther = new Decimal(formatEther(amountWei.toString()).toString());
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
