import { ApolloClient, createHttpLink, DocumentNode, gql, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client/core';
import fetch from 'cross-fetch';
import { Agent } from 'https';
import { Network } from './Network';
import { Address, GraphqlType, StreamPeriodResult, Token, TransferEventResult, TransferEventResultWithToken } from './Types';
import { uniq } from 'lodash';

export interface StreamPeriodsResults {
	inflowingStreamPeriods: StreamPeriodResult[];
	outflowingStreamPeriods: StreamPeriodResult[];
	inflowingActiveStreamPeriods: StreamPeriodResult[];
	outflowingActiveStreamPeriods: StreamPeriodResult[];
	outgoingTransfers: TransferEventResult[];
	incomingTransfers: TransferEventResult[];
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
): Promise<{ streamPeriods: StreamPeriodResult[], transfers: TransferEventResultWithToken[] }> {
	const client = getSubgraphClient(network);
	const query =
		counterpartyAddresses.length > 0 ? streamPeriodsQueryWithCounterparty : streamPeriodsQueryWithoutCounterparty;

	const { streamPeriods, transfers } = await queryStreamPeriodsRecursive(
		{ network, addresses, from: startTimestamp, to: endTimestamp, counterpartyAddresses, first: 1000, skip: 0 },
		query,
		client,
		[],
		[],
		0,
	);

	const transferTokens = uniq(transfers.map(transfer => transfer.token));

	const tokenQueryVariables = { tokens: transferTokens };
	const { data: tokenData } = await client.query<
		{ tokens: (Token & GraphqlType)[] }
	>({
		query: tokenQuery,
		variables: tokenQueryVariables,
	}).catch((e) => {
		console.error(`Failed to fetch tokens ${network.name} subgraph`, tokenQueryVariables, e);
		throw e;
	});;

	const allTransfersWithTokens = transfers.map(transfer => ({
		...transfer,
		token: tokenData.tokens.find((token) => token.id === transfer.token)!,
	}));

	return { streamPeriods, transfers: allTransfersWithTokens };
}

async function queryStreamPeriodsRecursive(
	variables: StreamPeriodVariables,
	query: DocumentNode,
	client: ApolloClient<NormalizedCacheObject>,
	streamPeriods: Array<StreamPeriodResult>,
	transfers: Array<TransferEventResult>,
	currentPage: number,
): Promise<{ streamPeriods: StreamPeriodResult[], transfers: TransferEventResult[] }> {
	const response = await client
		.query<StreamPeriodsResults>({
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
		incomingTransfers,
		outgoingTransfers,
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

	const fetchedTransfers = [
		...incomingTransfers,
		...outgoingTransfers,
	].map((transfer) => ({
		...transfer,
		chainId: variables.network.id,
	}));

	const allStreamPeriods = streamPeriods.concat(fetchedStreamPeriods);
	const allTransfers = transfers.concat(fetchedTransfers);

	if (
		inflowingStreamPeriods.length >= variables.first ||
		outflowingStreamPeriods.length >= variables.first ||
		inflowingActiveStreamPeriods.length >= variables.first ||
		outflowingActiveStreamPeriods.length >= variables.first ||
		incomingTransfers.length >= variables.first ||
		outgoingTransfers.length >= variables.first
	) {
		const { skip, first, ...nextVariables } = variables;
		return queryStreamPeriodsRecursive(
			{ ...nextVariables, first, skip: skip + first * currentPage },
			query,
			client,
			allStreamPeriods,
			allTransfers,
			currentPage + 1,
		);
	}

	return { streamPeriods: allStreamPeriods, transfers: allTransfers };
}

function getSubgraphClient(network: Network) {
	return new ApolloClient({
		link: createHttpLink({
			uri: network.subgraphUrl,
			fetch,
			fetchOptions: {
				agent: new Agent({ rejectUnauthorized: false }), // To fix "Hostname/IP does not match certificate's altnames" issue
			},
		}),
		cache: new InMemoryCache(),
	});
}

const StreamPeriodFields = `
fragment periodFields on StreamPeriod {
	id
	flowRate
	token {
		...tokenFields
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

const TransferFields = `
	fragment transferFields on TransferEvent {
		id
		value
		token
		from {
			id
		}
		to {
			id
		}
		timestamp
		blockNumber
		transactionHash
	}
`;

const TokenFields = `
	fragment tokenFields on Token {
		id
		symbol
		name
		underlyingAddress
	}
`;

const tokenQuery = gql`
	query GetTokens($tokens: [ID!]!) {
		tokens(where: { id_in: $tokens }) {
			...tokenFields
		}
	}
	
	${TokenFields}
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
		incomingTransfers: transferEvents(
			first: $first
			skip: $skip
			where: {
				to_in: $addresses
				from_in: $counterpartyAddresses
			}
		) {
			...transferFields
		}
		outgoingTransfers: transferEvents(
			first: $first
			skip: $skip
			where: {
				timestamp_lt: $to
				timestamp_gte: $from
				to_in: $counterpartyAddresses
				from_in: $addresses
			}
		) {
			...transferFields
		}
	}

	${StreamPeriodFields}
	${TransferFields}
	${TokenFields}
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
		incomingTransfers: transferEvents(
			first: $first, 
			skip: $skip
			where: { 
				timestamp_lt: $to, 
				timestamp_gte: $from, 
				to_in: $addresses,
				from_not: "0x0000000000000000000000000000000000000000"
			}
		) {
			...transferFields
		}
		outgoingTransfers: transferEvents(
			first: $first, 
			skip: $skip
			where: { 
				timestamp_lt: $to, 
				timestamp_gte: $from, 
				from_in: $addresses,
				to_not: "0x0000000000000000000000000000000000000000"
			}
		) {
			...transferFields
		}
	}

	${StreamPeriodFields}
	${TransferFields}
	${TokenFields}
`;
