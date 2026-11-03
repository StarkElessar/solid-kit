import type { DateParts } from './date-parts';
import { daysInMonth } from './days-in-month';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Строгий разбор `YYYY-MM-DD`; несуществующая дата (30 февраля, нулевой год) даёт `null`. */
export function parseIsoDate(text: string): DateParts | null {
	const match = ISO_DATE.exec(text);
	if (!match) {
		return null;
	}
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
		return null;
	}
	return { year, month, day };
}
