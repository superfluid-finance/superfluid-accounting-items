import { NormalizedCacheObject } from '@apollo/client';
import { ApolloClient, DocumentNode, gql, HttpLink, InMemoryCache } from '@apollo/client/core';
import fetch from 'cross-fetch';
import { Network } from './Network';
import { Address, StreamPeriodResult } from './Types';

export interface StreamPeriodsResults {
	inflowingStreamPeriods: StreamPeriodResult[];
	outflowingStreamPeriods: StreamPeriodResult[];
	inflowingActiveStreamPeriods: StreamPeriodResult[];
	outflowingActiveStreamPeriods: StreamPeriodResult[];
}

interface StreamPeriodVariables {
	network: Network;
	from: number;
	to: number;
	addresses: Address[];
	counterpartyAddresses: Address[];
	first: number;
	skip: number;
}

export async function queryStreamPeriods(
	addresses: Address[],
	network: Network,
	startTimestamp: number,
	endTimestamp: number,
	counterpartyAddresses: Address[],
): Promise<StreamPeriodResult[]> {
	const client = getSubgraphClient(network);
	const query =
		counterpartyAddresses.length > 0 ? streamPeriodsQueryWithCounterparty : streamPeriodsQueryWithoutCounterparty;

	return queryStreamPeriodsRecursive(
		{ network, addresses, from: startTimestamp, to: endTimestamp, counterpartyAddresses, first: 1000, skip: 0 },
		query,
		client,
		[],
		0,
	);
}

async function queryStreamPeriodsRecursive(
	variables: StreamPeriodVariables,
	query: DocumentNode,
	client: ApolloClient<NormalizedCacheObject>,
	streamPeriods: Array<StreamPeriodResult>,
	currentPage: number,
): Promise<StreamPeriodResult[]> {
	const response = await client
		.query({
			variables,
			query,
		})
		.catch((e) => {
			console.log(`Failed to fetch stream periods from ${variables.network.name} subgraph`, variables, e);
			throw e;
		});

	const {
		inflowingStreamPeriods,
		outflowingStreamPeriods,
		inflowingActiveStreamPeriods,
		outflowingActiveStreamPeriods,
	} = response.data;

	const fetchedStreamPeriods = [
		...inflowingStreamPeriods,
		...outflowingStreamPeriods,
		...inflowingActiveStreamPeriods,
		...outflowingActiveStreamPeriods,
	].map((streamPeriod) => ({
		...streamPeriod,
		chainId: variables.network.id,
	}));

	const allStreamPeriods = streamPeriods.concat(fetchedStreamPeriods);

	if (
		inflowingStreamPeriods.length >= variables.first ||
		outflowingStreamPeriods.length >= variables.first ||
		inflowingActiveStreamPeriods.length >= variables.first ||
		outflowingActiveStreamPeriods.length >= variables.first
	) {
		const { skip, first, ...nextVariables } = variables;
		return queryStreamPeriodsRecursive(
			{ ...nextVariables, first, skip: skip + first * currentPage },
			query,
			client,
			allStreamPeriods,
			currentPage + 1,
		);
	}

	return allStreamPeriods;
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
		$first: Int!
		$skip: Int!
	) {
		inflowingStreamPeriods: streamPeriods(
			first: $first
			skip: $skip
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
			first: $first
			skip: $skip
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
			first: $first
			skip: $skip
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
			first: $first
			skip: $skip
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
		$first: Int!
		$skip: Int!
	) {
		inflowingStreamPeriods: streamPeriods(
			first: $first
			skip: $skip
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp_gte: $from, receiver_in: $addresses }
		) {
			...periodFields
		}
		outflowingStreamPeriods: streamPeriods(
			first: $first
			skip: $skip
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp_gte: $from, sender_in: $addresses }
		) {
			...periodFields
		}
		inflowingActiveStreamPeriods: streamPeriods(
			first: $first
			skip: $skip
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp: null, receiver_in: $addresses }
		) {
			...periodFields
		}
		outflowingActiveStreamPeriods: streamPeriods(
			first: $first
			skip: $skip
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp: null, sender_in: $addresses }
		) {
			...periodFields
		}
	}

	${StreamPeriodFields}
`;
