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
	flowRate: string;
	token: Token;
	chainId: number;
	sender: Address;
	receiver: Address;
	startedAtTimestamp: number;
	startedAtBlockNumber: number;
	startedAtEvent: string;
	stoppedAtTimestamp?: number;
	stoppedAtBlockNumber?: number;
	stoppedAtEvent?: string;
	totalAmountStreamed: string;
	virtualPeriods?: VirtualStreamPeriod[];
}

export interface VirtualStreamPeriod {
	startTime: number;
	endTime: number;
	amount: string;
	amountFiat?: string;
}
