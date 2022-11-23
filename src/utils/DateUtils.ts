import { endOfDay, endOfMonth, endOfWeek, endOfYear, fromUnixTime, getUnixTime } from 'date-fns';

/**
 * Enum numerical value is expressed in seconds.
 */

export enum UnitOfTime {
	Second = 1,
	Minute = 60,
	Hour = 3600,
	Day = 86400,
	Week = 604800,
	Month = 2592000,
	Year = 31536000,
}

export function getEndOfPeriodTimestamp(timestamp: number, period: UnitOfTime) {
	const date = fromUnixTime(timestamp);
	return getUnixTime(getEndOfPeriod(date, period));
}

function getEndOfPeriod(date: Date, period: UnitOfTime) {
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
