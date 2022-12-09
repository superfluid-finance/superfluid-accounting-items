import { networks } from '../utils/Network';
import { getVirtualizedStreamPeriods } from '../services/StreamPeriodsService';
import { Address } from '../utils/Types';
import { CurrencyCode } from '../utils/CurrencyUtils';
import { UnitOfTime } from '../utils/DateUtils';

export interface AccountingRequest extends Event {
	queryStringParameters: {
		chains: string;
		address: Address;
		start: number;
		end: number;
		priceGranularity: number;
		virtualization: number;
		currency: CurrencyCode;
		receivers?: string;
	};
}

export const handler = async (event: AccountingRequest) => {
	try {
		// TODO: Transform inputs (less error prone)
		// TODO: Validate inputs
		const {
			chains,
			address,
			start,
			end,
			virtualization,
			receivers = '',
			currency,
			priceGranularity,
		} = event.queryStringParameters;

		const counterpartyAddresses = receivers.split(',').filter((addr) => !!addr);
		const mappedNetworks = chains.split(',').map((chain) => networks[Number(chain)]);

		const virtualizedStreamPeriods = await getVirtualizedStreamPeriods(
			address,
			mappedNetworks,
			Number(start),
			Number(end),
			Number(virtualization) as UnitOfTime,
			counterpartyAddresses,
			currency as CurrencyCode,
			Number(priceGranularity) as UnitOfTime,
		);

		return {
			statusCode: 200,
			body: JSON.stringify(virtualizedStreamPeriods),
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		};
	} catch (e) {
		return {
			statusCode: 500,
			body: e.message,
		};
	}
};
