import { CoingeckoCoin } from './CoingeckoApi';

export interface Network {
	id: number;
	slug: string;
	name: string;
	subgraphUrl: string;
	coingeckoId: keyof CoingeckoCoin['platforms'];
}

export const networks: { [any: number]: Network } = {
	1: {
		id: 1,
		slug: 'ethereum',
		name: 'Ethereum',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-eth-mainnet',
		coingeckoId: 'ethereum',
	},
	100: {
		id: 100,
		slug: 'gnosis',
		name: 'Gnosis Chain',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-xdai',
		coingeckoId: 'xdai',
	},
	137: {
		id: 137,
		slug: 'polygon',
		name: 'Polygon',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-matic',
		coingeckoId: 'polygon-pos',
	},
	10: {
		id: 10,
		slug: 'optimism',
		name: 'Optimism',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-optimism-mainnet',
		coingeckoId: 'optimistic-ethereum',
	},
	42161: {
		id: 42161,
		slug: 'arbitrum-one',
		name: 'Arbitrum One',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-arbitrum-one',
		coingeckoId: 'arbitrum-one',
	},
	42220: {
		id: 42220,
		slug: 'celo',
		name: 'Celo Mainnet',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-celo-mainnet',
		coingeckoId: 'celo',
	},
	43114: {
		id: 43114,
		slug: 'avalanche',
		name: 'Avalanche C',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-avalanche-c',
		coingeckoId: 'avalanche',
	},
	56: {
		id: 56,
		slug: 'bsc',
		name: 'BNB Smart Chain',
		subgraphUrl: 'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-bsc-mainnet',
		coingeckoId: 'binance-smart-chain',
	},
};
