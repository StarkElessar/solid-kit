import type { DateParts } from './date-parts';
import { parseIsoDate } from './parse-iso-date';

/** Разбирает ISO-проп; непустое недопустимое значение это ошибка разработчика: предупреждение в dev и `undefined`. */
export function readDateProp(component: string, name: string, text: string | null | undefined): DateParts | undefined {
	if (text === undefined || text === null || text === '') {
		return undefined;
	}
	const parts = parseIsoDate(text);
	if (!parts && import.meta.env.DEV) {
		console.warn(`[solid-kit] ${component}: ${name} must be a real date in YYYY-MM-DD format, got "${text}".`);
	}
	return parts ?? undefined;
}
