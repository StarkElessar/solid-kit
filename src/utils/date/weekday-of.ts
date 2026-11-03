import type { DateParts } from './date-parts';
import { toUtcTime } from './to-utc-time';

/** День недели: 0 воскресенье … 6 суббота. */
export function weekdayOf(parts: DateParts): number {
	return new Date(toUtcTime(parts)).getUTCDay();
}
