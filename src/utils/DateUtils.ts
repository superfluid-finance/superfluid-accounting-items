import {
	endOfDay,
	endOfHour,
	endOfMonth,
	endOfWeek,
	endOfYear,
	fromUnixTime,
	getUnixTime,
	startOfDay,
	startOfHour,
	startOfMonth,
	startOfWeek,
	startOfYear,
} from 'date-fns';

export enum VirtualizationPeriod {
	Hour = 'hour',
	Day = 'day',
	Week = 'week',
	Month = 'month',
	Year = 'year',
}

/**
 * Enum numerical value is expressed in seconds.
 */
export enum UnitOfTime {
	Hour = 3600,
	Day = 86400,
	Week = 604800,
	Month = 2628000,
	Year = 31536000,
}

export const Interval = {
	[UnitOfTime.Hour]: 'hourly',
	[UnitOfTime.Day]: 'daily',
	[UnitOfTime.Week]: 'weekly',
	[UnitOfTime.Month]: 'monthly',
	[UnitOfTime.Year]: 'yearly',
};

export const VirtualizationUnitOfTimeMap = {
	[VirtualizationPeriod.Hour]: UnitOfTime.Hour,
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
		case UnitOfTime.Hour:
			return endOfHour(date);
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
		case UnitOfTime.Hour:
			return startOfHour(date);
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
