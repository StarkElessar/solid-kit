import { compareDates } from '../date/compare-dates';
import { compareTimes } from '../time/compare-times';

import type { DateTimeParts } from './date-time-parts';

/** Отрицательное число, если `a` раньше `b`, ноль при равенстве, положительное, если позже. */
export function compareDateTimes(a: DateTimeParts, b: DateTimeParts): number {
	return compareDates(a.date, b.date) || compareTimes(a.time, b.time);
}
