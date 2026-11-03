import { clampDate } from './clamp-date';
import { MAX_DATE, MIN_DATE } from './date-limits';
import type { DateParts } from './date-parts';
import { daysInMonth } from './days-in-month';

/** Сдвиг на `count` месяцев; день ужимается до длины месяца (31 января + 1 месяц = конец февраля). */
export function addMonths(parts: DateParts, count: number): DateParts {
	const total = parts.year * 12 + (parts.month - 1) + count;
	const year = Math.floor(total / 12);
	const month = total - year * 12 + 1;
	const day = Math.min(parts.day, daysInMonth(year, month));
	return clampDate({ year, month, day }, MIN_DATE, MAX_DATE);
}
