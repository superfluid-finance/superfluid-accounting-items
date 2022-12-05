import fetch from 'cross-fetch';
import { fromUnixTime, getUnixTime } from 'date-fns';
import groupBy from 'lodash/fp/groupBy';
import { NetworkToken } from '../services/TokenPriceService';
import { CurrencyCode } from './CurrencyUtils';
import { getEndOfPeriod, getStartOfPeriod, Interval, UnitOfTime } from './DateUtils';

export interface CoingeckoCoin {
	id: string;
	symbol: string;
	name: string;
	platforms: {
		'ethereum'?: string;
		'optimistic-ethereum'?: string;
		'energi'?: string;
		'binance-smart-chain'?: string;
		'sora'?: string;
		'avalanche'?: string;
		'harmony-shard-0'?: string;
		'fantom'?: string;
		'polygon-pos'?: string;
		'huobi-token'?: string;
	};
}

export interface TimespanPrice {
	start: number; // UNIX timestamp
	price: Number;
}

export interface CoingeckoToken extends NetworkToken {
	coingeckoId: string;
	prices?: TimespanPrice[];
}

export async function fetchCoins(): Promise<CoingeckoCoin[]> {
	const query = new URLSearchParams({
		include_platform: 'true',
	});

	return fetch(`https://api.coingecko.com/api/v3/coins/list?${query}`)
		.then((res) => res?.json())
		.catch((err) => {
			console.log('Failed to fetch coingecko coins list.');
			throw err;
		});
}

export async function fetchCoinPricesByGranularity(
	token: CoingeckoToken,
	currency: CurrencyCode,
	priceGranularity: UnitOfTime,
	startTimestamp: number,
	endTimestamp: number,
) {
	const query = new URLSearchParams({
		vs_currency: currency,
		from: startTimestamp.toString(),
		to: endTimestamp.toString(),
		interval: Interval[priceGranularity],
	});

	return fetch(`https://api.coingecko.com/api/v3/coins/${token.coingeckoId}/market_chart/range?${query}`)
		.then((res) => res?.json())
		.then((response) => {
			return {
				...token,
				prices: mapTokenPricesByGranularity(response.prices, priceGranularity),
			};
		})
		.catch((err) => {
			console.log('Failed to fetch coingecko coin prices.');
			throw err;
		});
}

function mapTokenPricesByGranularity(prices: [[string, string]], priceGranularity: UnitOfTime): TimespanPrice[] {
	const tokenPricesGroups = groupBy(
		([timestamp]) => getUnixTime(getStartOfPeriod(new Date(timestamp), priceGranularity)),
		prices,
	);

	// TODO: If we have to show that there was no price data available, then we should change the initial reducer value to null.
	return Object.entries(tokenPricesGroups).map(([groupTimestamp, prices]) => {
		const averagePrice =
			prices.reduce((total, [_timestamp, price]) => {
				return total + Number(price);
			}, 0) / (prices.length || 1); // Dividing fallback to 1 because we don't want to divide with 0

		return {
			start: getUnixTime(getStartOfPeriod(fromUnixTime(Number(groupTimestamp)), priceGranularity)),
			price: averagePrice,
		} as TimespanPrice;
	});
}
