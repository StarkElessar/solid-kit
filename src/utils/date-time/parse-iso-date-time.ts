import { parseIsoDate } from '../date/parse-iso-date';
import { parseIsoTime } from '../time/parse-iso-time';

import type { DateTimeParts } from './date-time-parts';

const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;

/** Строгий разбор `YYYY-MM-DDTHH:mm`; секунды, пояс, пробел вместо `T` и несуществующие дата или время дают `null`. */
export function parseIsoDateTime(text: string): DateTimeParts | null {
	const match = ISO_DATE_TIME.exec(text);
	if (!match) {
		return null;
	}
	const date = parseIsoDate(match[1] ?? '');
	const time = parseIsoTime(match[2] ?? '');
	return date && time ? { date, time } : null;
}
