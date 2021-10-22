const { ApolloClient, InMemoryCache } = require('@apollo/client/core');
const { createHttpLink } = require('apollo-link-http');
const { MATIC, XDAI, KOVAN, RINKEBY, ROPSTEN, MUMBAI, GOERLI, LOCAL } = require('./constants');
const fetch = require('cross-fetch');

const networkGraphUrls = new Map();
networkGraphUrls.set(LOCAL, 'http://localhost:8000/subgraphs/name/superfluid-test');
networkGraphUrls.set(MATIC, 'https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-feature-matic');
networkGraphUrls.set(XDAI, 'https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-feature-xdai');
networkGraphUrls.set(GOERLI, 'https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-feature-goerli');
networkGraphUrls.set(KOVAN, 'https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-feature-kovan');
networkGraphUrls.set(RINKEBY, 'https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-feature-rinkeby');
networkGraphUrls.set(ROPSTEN, 'https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-feature-ropsten');
networkGraphUrls.set(MUMBAI, 'https://thegraph.com/hosted-service/subgraph/superfluid-finance/protocol-feature-mumbai');

function getClientForNetwork(networkName) {
	const networkUrl = networkGraphUrls.get(networkName.toLowerCase());
	if (!networkUrl) {
		throw new Error('Unsupported network');
	}
	const client = new ApolloClient({
		link: createHttpLink({
			uri: networkUrl,
			fetch,
		}),
		cache: new InMemoryCache(),
	});
	return client;
}

function validateInputs(address, network) {
	if (!address) {
		throw new Error('Address not defined');
	}
	if (!network || !networkGraphUrls.has(network.toLowerCase())) {
		throw new Error('Unsupported network');
	}
}

module.exports = { getClientForNetwork, validateInputs };
