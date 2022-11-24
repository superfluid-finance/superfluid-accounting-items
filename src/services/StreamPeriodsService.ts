import { fromUnixTime, getUnixTime, startOfMonth } from 'date-fns';
import { BigNumber } from 'ethers';
import flatten from 'lodash/fp/flatten';
import { CoingeckoToken, fetchCoins, TimespanPrice } from '../utils/CoingeckoApi';
import { CurrencyCode } from '../utils/CurrencyUtils';
import { getEndOfPeriodTimestamp, UnitOfTime } from '../utils/DateUtils';
import { Network } from '../utils/Network';
import { queryStreamPeriods } from '../utils/SubgraphApi';
import { Address, StreamPeriodResult, VirtualStreamPeriod } from '../utils/Types';
import { getTokensPrices, NetworkToken } from './TokenPriceService';

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
	// const uniqueTokens = getUniqueNetworkTokenAddresses(streamPeriods);

	// const tokensWithPriceData = await getTokensPrices(
	// 	uniqueTokens,
	// 	currency,
	// 	priceGranularity,
	// 	startTimestamp,
	// 	endTimestamp,
	// );

	// Map stream periods into virtualized periods based on conf
	return streamPeriods.map((streamPeriod) => {
		// const tokenPriceData = tokensWithPriceData.find((tokenWithPriceData) => {
		// 	tokenWithPriceData.chainId === streamPeriod.chainId && tokenWithPriceData.token === streamPeriod.token.id;
		// });

		return {
			...streamPeriod,
			virtualPeriods: virtualizeStreamPeriod(
				streamPeriod,
				fromUnixTime(startTimestamp),
				fromUnixTime(endTimestamp),
				period,
				[],
				// tokenPriceData?.prices || [],
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
	};

	if (endTimestamp <= virtualPeriodEndTimestamp) return [virtualStreamPeriod];

	const nextPeriodStartDate = fromUnixTime(virtualPeriodEndTimestamp + 1);
	return [
		virtualStreamPeriod,
		...virtualizeStreamPeriod(streamPeriod, nextPeriodStartDate, endDate, period, priceData),
	];
}

function getAmountInTimespan(startTimestamp: number, endTimestamp: number, flowRate: string): BigNumber {
	return BigNumber.from(flowRate).mul(BigNumber.from(endTimestamp - startTimestamp));
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

function calculateVirtualStreamPeriodPrice(virtualStreamPeriod: VirtualStreamPeriod, priceData: TimespanPrice[]) {
	const { startTime, endTime, amount } = virtualStreamPeriod;
}
