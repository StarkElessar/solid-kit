import type { DateParts } from './date-parts';

export function formatIsoDate(parts: DateParts): string {
	const year = String(parts.year).padStart(4, '0');
	const month = String(parts.month).padStart(2, '0');
	const day = String(parts.day).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
