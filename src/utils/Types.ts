import { TimespanPrice } from './CoingeckoApi';

export type Address = string;

export interface Token {
	id: Address;
	symbol: string;
	name: string;
	underlyingAddress: Address;
}

export interface StreamPeriodResult {
	id: string;
	flowRate: string;
	token: Token;
	chainId: number;
	sender: {
		id: Address;
	};
	receiver: {
		id: Address;
	};
	startedAtTimestamp: number;
	startedAtBlockNumber: number;
	startedAtEvent: {
		transactionHash: string;
	};
	stoppedAtTimestamp?: number;
	stoppedAtBlockNumber?: number;
	stoppedAtEvent?: {
		transactionHash: string;
	};
	totalAmountStreamed: string;
}

export interface StreamPeriod {
	id: string;
	startTime: number;
	endTime: number;
	amount: string;
	token: Token;
	sender: Address;
	receiver: Address;
}

export interface VirtualStreamPeriod {
	startTime: number;
	endTime: number;
	amount: string;
	amountFiat?: string;
}
