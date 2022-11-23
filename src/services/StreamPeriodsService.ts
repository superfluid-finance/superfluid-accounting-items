import { fromUnixTime, getUnixTime } from 'date-fns';
import { BigNumber } from 'ethers';
import { Network } from '../utils/Network';
import { queryStreamPeriods } from '../utils/SubgraphApi';
import { Address, StreamPeriodResult, VirtualStreamPeriod } from '../utils/Types';
import { getEndOfPeriodTimestamp, UnitOfTime } from '../utils/DateUtils';

export async function getVirtualizedStreamPeriods(
	address: Address,
	networks: Network[],
	startTimestamp: number = 0,
	endTimestamp: number = getUnixTime(Date.now()),
	period: UnitOfTime,
	counterpartyAddresses: Address[],
) {
	// Fetch all stream periods
	const networksStreamPeriodsResponse = await Promise.all(
		networks.map((network) =>
			queryStreamPeriods(address, network, startTimestamp, endTimestamp, counterpartyAddresses),
		),
	);

	// Merge different stream periods
	const allStreamPeriods = networksStreamPeriodsResponse.reduce(
		(asp, streamPeriodsResponse) => [
			...asp,
			...streamPeriodsResponse.data.inflowingStreamPeriods,
			...streamPeriodsResponse.data.outflowingStreamPeriods,
			...streamPeriodsResponse.data.inflowingActiveStreamPeriods,
			...streamPeriodsResponse.data.outflowingActiveStreamPeriods,
		],
		[] as StreamPeriodResult[],
	);

	// Map stream periods into virtualized periods based on conf
	return allStreamPeriods.map((streamPeriod) => ({
		...streamPeriod,
		virtualPeriods: virtualizeStreamPeriod(
			streamPeriod,
			fromUnixTime(startTimestamp),
			fromUnixTime(endTimestamp),
			period,
		),
	}));
}

/**
 * Recursive function to virtualize stream period in different time spans. (Daily, Weekly, Monthly etc.)
 * Amounts are calculated based on the overlapping period of date filter, stream period and virtualized period.
 */
function virtualizeStreamPeriod(streamPeriod: StreamPeriodResult, startDate: Date, endDate: Date, period: UnitOfTime) {
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
	return [virtualStreamPeriod, ...virtualizeStreamPeriod(streamPeriod, nextPeriodStartDate, endDate, period)];
}

function getAmountInTimespan(startTimestamp: number, endTimestamp: number, flowRate: string): BigNumber {
	return BigNumber.from(flowRate).mul(BigNumber.from(endTimestamp - startTimestamp));
}
