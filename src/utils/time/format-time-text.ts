import type { TimeParts } from './time-parts';
import { timePattern } from './time-pattern';

/**
 * Текст времени по образцу локали: `14:30` в 24-часовом виде (часы с ведущим нулём), `2:30 PM` в 12-часовом
 * (`12:00 AM` для полуночи, `12:00 PM` для полудня).
 */
export function formatTimeText(parts: TimeParts, locale: string, hour12?: boolean): string {
	const pattern = timePattern(locale, hour12);
	const minute = String(parts.minute).padStart(2, '0');
	if (!pattern.hour12) {
		return `${String(parts.hour).padStart(2, '0')}${pattern.separator}${minute}`;
	}
	const hour = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
	const period = parts.hour < 12 ? pattern.am : pattern.pm;
	const time = `${hour}${pattern.separator}${minute}`;
	return pattern.periodFirst ? `${period}${pattern.periodGap}${time}` : `${time}${pattern.periodGap}${period}`;
}
