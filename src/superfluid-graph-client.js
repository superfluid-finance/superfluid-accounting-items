const { gql } = require('@apollo/client/core');
const { getClientForNetwork } = require('./helper');

async function queryStreamPeriods(from, to, accountAddress, network) {
	const client = getClientForNetwork(network);
	const result = await client.query({
		variables: {
			from,
			to,
			accountAddress,
		},
		query,
	});
	return result;
}

module.exports = { queryStreamPeriods };

const query = gql`
	query GetStreamPeriodsForAddressWithin($from: BigInt!, $to: BigInt!, $accountAddress: String!) {
		inflowingStreamPeriods: streamPeriods(
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp_gte: $from, receiver: $accountAddress }
		) {
			...periodFields
		}
		outflowingStreamPeriods: streamPeriods(
			where: { startedAtTimestamp_lt: $to, stoppedAtTimestamp_gte: $from, sender: $accountAddress }
		) {
			...periodFields
		}
	}

	fragment periodFields on StreamPeriod {
		flowRate
		token {
			symbol
			name
			superTokenAddress: id
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
