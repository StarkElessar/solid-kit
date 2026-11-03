import type { DateParts } from './date-parts';

/** Миллисекунды от эпохи для полуночи UTC этой даты; `setUTCFullYear` нужен, чтобы годы меньше 100 не сдвигались на 1900. */
export function toUtcTime(parts: DateParts): number {
	const date = new Date(0);
	date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
	return date.getTime();
}
