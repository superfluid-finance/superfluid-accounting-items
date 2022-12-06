import { CoingeckoCoin, CoingeckoToken, fetchCoinPricesByGranularity, fetchCoins } from '../utils/CoingeckoApi';
import { CurrencyCode } from '../utils/CurrencyUtils';
import { UnitOfTime } from '../utils/DateUtils';
import { networks } from '../utils/Network';

export interface NetworkToken {
	chainId: number;
	token: string;
}

export const getTokensPrices = async (
	networkTokens: NetworkToken[],
	currency: CurrencyCode,
	priceGranularity: UnitOfTime,
	startTimestamp: number,
	endTimestamp: number,
) => {
	const tokens = await fetchCoins();

	const matchedTokens = matchCoingeckoTokens(networkTokens, tokens);

	return Promise.all(
		matchedTokens.map((matchedToken) =>
			fetchCoinPricesByGranularity(matchedToken, currency, priceGranularity, startTimestamp, endTimestamp),
		),
	);
};

function matchCoingeckoTokens(networkTokens: NetworkToken[], coingeckoCoins: CoingeckoCoin[]): CoingeckoToken[] {
	return networkTokens.reduce((matchedTokens, networkToken) => {
		const coingeckoCoin = coingeckoCoins.find(
			(token) => token.platforms[networks[networkToken.chainId].coingeckoId] === networkToken.token,
		);

		if (!coingeckoCoin) return matchedTokens;

		const coingeckoToken = {
			...networkToken,
			coingeckoId: coingeckoCoin.id,
		} as CoingeckoToken;

		return [...matchedTokens, coingeckoToken];
	}, [] as CoingeckoToken[]);
}
