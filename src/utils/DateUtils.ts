import {
	endOfDay,
	endOfMonth,
	endOfWeek,
	endOfYear,
	fromUnixTime,
	getUnixTime,
	startOfDay,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from 'date-fns';

export enum VirtualizationPeriod {
	Day = 'day',
	Week = 'week',
	Month = 'month',
	Year = 'year',
}

/**
 * Enum numerical value is expressed in seconds.
 */
export enum UnitOfTime {
	Day = 86400,
	Week = 604800,
	Month = 2628000,
	Year = 31536000,
}

export const Interval = {
	[UnitOfTime.Day]: 'daily',
	[UnitOfTime.Week]: 'weekly',
	[UnitOfTime.Month]: 'monthly',
	[UnitOfTime.Year]: 'yearly',
};

export const VirtualizationUnitOfTimeMap = {
	[VirtualizationPeriod.Day]: UnitOfTime.Day,
	[VirtualizationPeriod.Week]: UnitOfTime.Week,
	[VirtualizationPeriod.Month]: UnitOfTime.Month,
	[VirtualizationPeriod.Year]: UnitOfTime.Year,
};

export function getEndOfPeriodTimestamp(timestamp: number, period: UnitOfTime) {
	const date = fromUnixTime(timestamp);
	return getUnixTime(getEndOfPeriod(date, period));
}

export function getEndOfPeriod(date: Date, period: UnitOfTime) {
	switch (period) {
		case UnitOfTime.Day:
			return endOfDay(date);
		case UnitOfTime.Week:
			return endOfWeek(date);
		case UnitOfTime.Month:
			return endOfMonth(date);
		case UnitOfTime.Year:
			return endOfYear(date);
		default:
			return date;
	}
}

export function getStartOfPeriod(date: Date, period: UnitOfTime) {
	switch (period) {
		case UnitOfTime.Day:
			return startOfDay(date);
		case UnitOfTime.Week:
			return startOfWeek(date);
		case UnitOfTime.Month:
			return startOfMonth(date);
		case UnitOfTime.Year:
			return startOfYear(date);
		default:
			return date;
	}
}
