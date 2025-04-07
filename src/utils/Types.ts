export type Address = string;

export interface Token {
	id: Address;
	symbol: string;
	name: string;
	underlyingAddress: Address;
}

export interface GraphqlType {
	__typename: string;
}

export interface StreamPeriodResult extends GraphqlType {
	id: string;
	chainId: number;
	flowRate: string;
	token: Token & GraphqlType;
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

export interface TransferEventResult extends GraphqlType {
	id: string;
	chainId: number;
	value: string;
	token: Address;
	from: {
		id: Address;
	};
	to: {
		id: Address;
	};
	timestamp: number;
	blockNumber: number;
	transactionHash: string;
}

export interface TransferEventResultWithToken extends Omit<TransferEventResult, 'token'> {
	token: Token & GraphqlType;
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
