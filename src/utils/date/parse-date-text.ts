import type { DateParts } from './date-parts';
import { type DatePart, datePattern } from './date-pattern';
import { daysInMonth } from './days-in-month';

const DIGITS_ONLY = /^\d+$/;
const ALLOWED = /^[\d\s.,/\\-]+$/;
const WIDTH: Record<DatePart, number> = { day: 2, month: 2, year: 4 };

function tokensOf(text: string, order: readonly DatePart[]): string[] | null {
	if (DIGITS_ONLY.test(text)) {
		const total = order.reduce((sum, part) => sum + WIDTH[part], 0);
		if (text.length !== total) {
			return null;
		}
		let offset = 0;
		return order.map((part) => {
			const token = text.slice(offset, offset + WIDTH[part]);
			offset += WIDTH[part];
			return token;
		});
	}
	if (!ALLOWED.test(text)) {
		return null;
	}
	const tokens = text.split(/[^\d]+/);
	return tokens.length === order.length && tokens.every((token) => token !== '') ? tokens : null;
}

/**
 * Разбор набранной даты по порядку частей локали. Части разделены любой нецифровой последовательностью из пробелов и знаков
 * препинания либо идут подряд цифрами (`03112026`); день и месяц из 1–2 цифр, год ровно из 4 цифр; несуществующая дата даёт `null`.
 */
export function parseDateText(text: string, locale: string): DateParts | null {
	const trimmed = text.trim();
	if (trimmed === '') {
		return null;
	}
	const { order } = datePattern(locale);
	const tokens = tokensOf(trimmed, order);
	if (!tokens) {
		return null;
	}
	const values: Record<DatePart, number> = { day: 0, month: 0, year: 0 };
	for (const [index, part] of order.entries()) {
		const token = tokens[index] ?? '';
		if (token.length > WIDTH[part] || (part === 'year' && token.length !== WIDTH.year)) {
			return null;
		}
		values[part] = Number(token);
	}
	const { year, month, day } = values;
	if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
		return null;
	}
	return { year, month, day };
}
