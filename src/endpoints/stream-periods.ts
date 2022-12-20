import { getVirtualizedStreamPeriods } from '../services/StreamPeriodsService';
import { CurrencyCode } from '../utils/CurrencyUtils';
import { UnitOfTime } from '../utils/DateUtils';
import { networks } from '../utils/Network';

import { Event } from '@netlify/functions/dist/function/event';
import { z } from 'zod';

const parseAddressesString = (addresses: string): Array<string> =>
	addresses
		.split(',')
		.filter((addr) => !!addr)
		.map((addr) => addr.toLowerCase());

export const AccountingQuery = z.object({
	chains: z
		.string()
		.transform((chains) => chains.split(',').map((chain) => networks[Number(chain)])) // Map to networks
		.refine((chains) => !chains.some((chain) => !chain)), // Checking for null values
	addresses: z
		.string()
		.transform(parseAddressesString)
		.refine((addresses) => addresses.length > 0, 'At least one address is required!'),
	start: z.preprocess((start) => Number(start), z.number()),
	end: z.preprocess((end) => Number(end), z.number()),
	priceGranularity: z.preprocess((priceGranularity) => Number(priceGranularity), z.nativeEnum(UnitOfTime)),
	virtualization: z.preprocess((virtualization) => Number(virtualization), z.nativeEnum(UnitOfTime)),
	currency: z.nativeEnum(CurrencyCode),
	counterparties: z.string().optional().default('').transform(parseAddressesString),
});

export const handler = async (event: Event) => {
	try {
		const { chains, addresses, start, end, virtualization, currency, priceGranularity, counterparties } =
			AccountingQuery.parse(event.queryStringParameters);

		const virtualizedStreamPeriods = await getVirtualizedStreamPeriods(
			addresses,
			chains,
			Number(start),
			Number(end),
			Number(virtualization) as UnitOfTime,
			counterparties,
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
	} catch (e: any) {
		return {
			statusCode: 500,
			body: e.message,
		};
	}
};
