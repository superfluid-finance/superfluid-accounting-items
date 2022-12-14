import { CoingeckoCoin } from './CoingeckoApi';

export interface Network {
	id: number;
	slug: string;
	name: string;
	subgraphId: string;
	coingeckoId: keyof CoingeckoCoin['platforms'];
}

export const networks: { [any: number]: Network } = {
	100: {
		id: 100,
		slug: 'gnosis',
		name: 'Gnosis Chain',
		subgraphId: 'protocol-v1-xdai',
		coingeckoId: 'xdai',
	},
	137: {
		id: 137,
		slug: 'polygon',
		name: 'Polygon',
		subgraphId: 'protocol-v1-matic',
		coingeckoId: 'polygon-pos',
	},
	43113: {
		id: 43113,
		slug: 'avalanche-fuji',
		name: 'Fuji (C-Chain)',
		subgraphId: 'protocol-v1-avalanche-fuji',
		coingeckoId: 'avalanche',
	},
	10: {
		id: 10,
		slug: 'optimism',
		name: 'Optimism',
		subgraphId: 'protocol-v1-optimism-mainnet',
		coingeckoId: 'optimistic-ethereum',
	},
	42161: {
		id: 42161,
		slug: 'arbitrum-one',
		name: 'Arbitrum One',
		subgraphId: 'protocol-v1-arbitrum-one',
		coingeckoId: 'arbitrum-one',
	},
	43114: {
		id: 43114,
		slug: 'avalanche',
		name: 'Avalanche C',
		subgraphId: 'protocol-v1-avalanche-c',
		coingeckoId: 'avalanche',
	},
	56: {
		id: 56,
		slug: 'bsc',
		name: 'BNB Smart Chain',
		subgraphId: 'protocol-v1-bsc-mainnet',
		coingeckoId: 'binance-smart-chain',
	},
};
// 100 Gnosis Chain
// 137 Polygon
// 43113 Fuji (C-Chain)
// 10 Optimism
// 42161 Arbitrum One
// 43114 Avalanche C
// 56 BNB Smart Chain
