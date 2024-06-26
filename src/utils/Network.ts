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
		subgraphUrl: 'https://eth-mainnet.subgraph.x.superfluid.dev/',
		coingeckoId: 'ethereum',
	},
	100: {
		id: 100,
		slug: 'gnosis',
		name: 'Gnosis Chain',
		subgraphUrl: 'https://xdai-mainnet.subgraph.x.superfluid.dev/',
		coingeckoId: 'xdai',
	},
	137: {
		id: 137,
		slug: 'polygon',
		name: 'Polygon',
		subgraphUrl: 'https://polygon-mainnet.subgraph.x.superfluid.dev/',
		coingeckoId: 'polygon-pos',
	},
	10: {
		id: 10,
		slug: 'optimism',
		name: 'Optimism',
		subgraphUrl: 'https://optimism-mainnet.subgraph.x.superfluid.dev/',
		coingeckoId: 'optimistic-ethereum',
	},
	42161: {
		id: 42161,
		slug: 'arbitrum-one',
		name: 'Arbitrum One',
		subgraphUrl: 'https://arbitrum-one.subgraph.x.superfluid.dev/',
		coingeckoId: 'arbitrum-one',
	},
	42220: {
		id: 42220,
		slug: 'celo',
		name: 'Celo Mainnet',
		subgraphUrl: 'https://celo-mainnet.subgraph.x.superfluid.dev/',
		coingeckoId: 'celo',
	},
	43114: {
		id: 43114,
		slug: 'avalanche',
		name: 'Avalanche C',
		subgraphUrl: 'https://avalance-c.subgraph.x.superfluid.dev/',
		coingeckoId: 'avalanche',
	},
	56: {
		id: 56,
		slug: 'bsc',
		name: 'BNB Smart Chain',
		subgraphUrl: 'https://bsc-mainnet.subgraph.x.superfluid.dev/',
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
	666666666 : {
		id: 666666666,
		slug: 'degen',
		name: 'Degen Chain',
		subgraphUrl: 'https://degenchain.subgraph.x.superfluid.dev/',
		coingeckoId: 'degen',
	},
};
