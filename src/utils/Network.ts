export interface Network {
	slug: string;
	name: string;
	subgraphId: string;
}

export const networks: { [any: number]: Network } = {
	5: {
		slug: 'goerli',
		name: 'Goerli',
		subgraphId: 'protocol-v1-goerli',
	},
	100: {
		slug: 'gnosis',
		name: 'Gnosis Chain',
		subgraphId: 'protocol-v1-xdai',
	},
	137: {
		slug: 'polygon',
		name: 'Polygon',
		subgraphId: 'protocol-v1-matic',
	},
	80001: {
		slug: 'polygon-mumbai',
		name: 'Polygon Mumbai',
		subgraphId: 'protocol-v1-mumbai',
	},
	43113: {
		slug: 'avalanche-fuji',
		name: 'Fuji (C-Chain)',
		subgraphId: 'protocol-v1-avalanche-fuji',
	},
	10: {
		slug: 'optimism',
		name: 'Optimism',
		subgraphId: 'protocol-v1-optimism-mainnet',
	},
	42161: {
		slug: 'arbitrum-one',
		name: 'Arbitrum One',
		subgraphId: 'protocol-v1-arbitrum-one',
	},
	43114: {
		slug: 'avalanche',
		name: 'Avalanche C',
		subgraphId: 'protocol-v1-avalanche-c',
	},
	56: {
		slug: 'bsc',
		name: 'BNB Smart Chain',
		subgraphId: 'protocol-v1-bsc-mainnet',
	},
};
