import { formatDateText } from '../date/format-date-text';
import { formatTimeText } from '../time/format-time-text';

import type { DateTimeParts } from './date-time-parts';

/** Текст даты со временем по образцу локали: `03.11.2026 14:30`, `11/03/2026 2:30 PM`. */
export function formatDateTimeText(value: DateTimeParts, locale: string, hour12?: boolean): string {
	return `${formatDateText(value.date, locale)} ${formatTimeText(value.time, locale, hour12)}`;
}
