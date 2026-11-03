import type { DateParts } from './date-parts';

export function fromUtcTime(time: number): DateParts {
	const date = new Date(time);
	return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}
