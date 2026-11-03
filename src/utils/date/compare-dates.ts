import type { DateParts } from './date-parts';

/** Отрицательное число, если `a` раньше `b`, ноль при равенстве, положительное, если позже. */
export function compareDates(a: DateParts, b: DateParts): number {
	return a.year - b.year || a.month - b.month || a.day - b.day;
}
