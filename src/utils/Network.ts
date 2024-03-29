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
	8453: {
		id: 8453,
		slug: 'base',
		name: 'Base',
		subgraphUrl: 'https://base-mainnet.subgraph.x.superfluid.dev/',
		coingeckoId: 'base',
	},
	534352: {
		id: 534352,
		slug: 'scroll',
		name: 'Scroll',
		subgraphUrl: 'https://scroll-mainnet.subgraph.x.superfluid.dev/',
		coingeckoId: 'scroll',
	},
	11155420: {
		id: 11155420,
		slug: 'optimism-sepolia',
		name: 'Optimism Sepolia',
		subgraphUrl: 'https://optimism-sepolia.subgraph.x.superfluid.dev/',
		coingeckoId: 'optimism-sepolia',
	},
};
