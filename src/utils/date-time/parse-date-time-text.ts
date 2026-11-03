import { parseDateText } from '../date/parse-date-text';
import { parseTimeText } from '../time/parse-time-text';

import type { ParsedDateTimeText } from './parsed-date-time-text';

/**
 * Разбор набранного текста: дата до первого пробела, остаток это время. Дата без времени допустима (`time` равно `null`);
 * время без даты, пустая строка и мусор дают `null`.
 */
export function parseDateTimeText(text: string, locale: string, hour12?: boolean): ParsedDateTimeText | null {
	const trimmed = text.trim();
	const gap = trimmed.search(/\s/);
	const date = parseDateText(gap === -1 ? trimmed : trimmed.slice(0, gap), locale);
	if (!date) {
		return null;
	}
	if (gap === -1) {
		return { date, time: null };
	}
	const time = parseTimeText(trimmed.slice(gap + 1), locale, hour12);
	return time ? { date, time } : null;
}
