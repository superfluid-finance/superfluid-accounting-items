import { ApolloQueryResult, gql, ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import fetch from 'cross-fetch';
import { Network } from './Network';
import { Address, StreamPeriodResult } from './Types';

export interface StreamPeriodsResults {
	inflowingStreamPeriods: StreamPeriodResult[];
	outflowingStreamPeriods: StreamPeriodResult[];
	inflowingActiveStreamPeriods: StreamPeriodResult[];
	outflowingActiveStreamPeriods: StreamPeriodResult[];
}

export async function queryStreamPeriods(
	addresses: Address[],
	network: Network,
	startTimestamp: number,
	endTimestamp: number,
	counterpartyAddresses: Address[],
): Promise<StreamPeriodResult[]> {
	const client = getSubgraphClient(network);

	return client
		.query({
			variables: {
				from: startTimestamp,
				to: endTimestamp,
				addresses,
				counterpartyAddresses,
			},
			query:
				counterpartyAddresses.length > 0
					? streamPeriodsQueryWithCounterparty
					: streamPeriodsQueryWithoutCounterparty,
		})
		.then((response: ApolloQueryResult<StreamPeriodsResults>) =>
			[
				...response.data.inflowingStreamPeriods,
				...response.data.outflowingStreamPeriods,
				...response.data.inflowingActiveStreamPeriods,
				...response.data.outflowingActiveStreamPeriods,
			].map((streamPeriod) => ({
				...streamPeriod,
				chainId: network.id,
			})),
		)
		.catch((e) => {
			console.log(`Failed to fetch stream periods from ${network.name} subgraph`, e);
			throw e;
		});
}

function getSubgraphClient(network: Network) {
	return new ApolloClient({
		link: new HttpLink({
			uri: `https://api.thegraph.com/subgraphs/name/superfluid-finance/${network.subgraphId}`,
			fetch,
		}),
		cache: new InMemoryCache(),
	});
}

const StreamPeriodFields = `
fragment periodFields on StreamPeriod {
	id
	flowRate
	token {
		id
		symbol
		name
		underlyingAddress
	}
	sender {
		id
	}
	receiver {
		id
	}
	startedAtTimestamp
	startedAtBlockNumber
	startedAtEvent {
		transactionHash
	}
	stoppedAtTimestamp
	stoppedAtBlockNumber
	stoppedAtEvent {
		transactionHash
	}
	totalAmountStreamed
}
`;

const streamPeriodsQueryWithCounterparty = gql`
	query GetStreamPeriodsForAddressWithin(
		$from: BigInt!
		$to: BigInt!
		$addresses: [String!]!
		$counterpartyAddresses: [String]
	) {
		inflowingStreamPeriods: streamPeriods(
			first: 1000
			where: {
				startedAtTimestamp_lt: $to
				stoppedAtTimestamp_gte: $from
				receiver_in: $addresses
				sender_in: $counterpartyAddresses
			}
		) {
			...periodFields
		}
		outflowingStreamPeriods: streamPeriods(
			first: 1000
			where: {
				startedAtTimestamp_lt: $to
				stoppedAtTimestamp_gte: $from
				sender_in: $addresses
				receiver_in: $counterpartyAddresses
			}
		) {
			...periodFields
		}
		inflowingActiveStreamPeriods: streamPeriods(
			first: 1000
			where: {
				startedAtTimestamp_lt: $to
				stoppedAtTimestamp: null
				receiver_in: $addresses
				sender_in: $counterpartyAddresses
			}
		) {
			...periodFields
		}
		outflowingActiveStreamPeriods: streamPeriods(
			first: 1000
			where: {
				startedAtTimestamp_lt: $to
				stoppedAtTimestamp: null
				sender_in: $addresses
				receiver_in: $counterpartyAddresses
			}
		) {
			...periodFields
		}
	}

	${StreamPeriodFields}
`;

const streamPeriodsQueryWithoutCounterparty = gql`
	query GetStreamPeriodsForAddressWithin(
		$from: BigInt!
		$to: BigInt!
		$addresses: [String!]!
		$counterpartyAddresses: [String]
	) {
		inflowingStreamPeriods: streamPeriods(
			first: 1000
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp_gte: $from, receiver_in: $addresses }
		) {
			...periodFields
		}
		outflowingStreamPeriods: streamPeriods(
			first: 1000
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp_gte: $from, sender_in: $addresses }
		) {
			...periodFields
		}
		inflowingActiveStreamPeriods: streamPeriods(
			first: 1000
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp: null, receiver_in: $addresses }
		) {
			...periodFields
		}
		outflowingActiveStreamPeriods: streamPeriods(
			first: 1000
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp: null, sender_in: $addresses }
		) {
			...periodFields
		}
	}

	${StreamPeriodFields}
`;
