import type { TimeParts } from './time-parts';

/** Отрицательное число, если `a` раньше `b`, положительное, если позже, ноль при равенстве. */
export function compareTimes(a: TimeParts, b: TimeParts): number {
	return (a.hour - b.hour) || (a.minute - b.minute);
}
