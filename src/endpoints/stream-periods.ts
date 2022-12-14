import { getVirtualizedStreamPeriods } from '../services/StreamPeriodsService';
import { CurrencyCode } from '../utils/CurrencyUtils';
import { UnitOfTime } from '../utils/DateUtils';
import { networks } from '../utils/Network';

import { Event } from '@netlify/functions/dist/function/event';
import { z } from 'zod';

export const AccountingQuery = z.object({
	chains: z
		.string()
		.transform((chains) => chains.split(',').map((chain) => networks[Number(chain)])) // Map to networks
		.refine((chains) => !chains.some((chain) => !chain)), // Checking for null values
	address: z.string(),
	start: z.preprocess((start) => Number(start), z.number()),
	end: z.preprocess((end) => Number(end), z.number()),
	priceGranularity: z.preprocess((priceGranularity) => Number(priceGranularity), z.nativeEnum(UnitOfTime)),
	virtualization: z.preprocess((virtualization) => Number(virtualization), z.nativeEnum(UnitOfTime)),
	currency: z.nativeEnum(CurrencyCode),
	counterparties: z
		.string()
		.optional()
		.default('')
		.transform((counterparties) => counterparties.split(',').filter((addr) => !!addr)),
});

export const handler = async (event: Event) => {
	try {
		const { chains, address, start, end, virtualization, currency, priceGranularity, counterparties } =
			AccountingQuery.parse(event.queryStringParameters);

		const virtualizedStreamPeriods = await getVirtualizedStreamPeriods(
			address,
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
