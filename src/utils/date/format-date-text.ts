import type { DateParts } from './date-parts';
import { type DatePart, datePattern } from './date-pattern';

function partText(parts: DateParts, part: DatePart): string {
	if (part === 'year') {
		return String(parts.year).padStart(4, '0');
	}
	return String(part === 'month' ? parts.month : parts.day).padStart(2, '0');
}

/** Текст даты по образцу локали с ведущими нулями: `03.11.2026`, `11/03/2026`, `2026/11/03`. */
export function formatDateText(parts: DateParts, locale: string): string {
	const pattern = datePattern(locale);
	return pattern.order.map((part) => partText(parts, part)).join(pattern.separator);
}
