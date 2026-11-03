import type { DateTimeParts } from './date-time-parts';
import { parseIsoDateTime } from './parse-iso-date-time';

/** Разбирает ISO-проп; непустое недопустимое значение это ошибка разработчика: предупреждение в dev и `undefined`. */
export function readDateTimeProp(component: string, name: string, text: string | null | undefined): DateTimeParts | undefined {
	if (text === undefined || text === null || text === '') {
		return undefined;
	}
	const parts = parseIsoDateTime(text);
	if (!parts && import.meta.env.DEV) {
		console.warn(`[solid-kit] ${component}: ${name} must be a real date and time in YYYY-MM-DDTHH:mm format, got "${text}".`);
	}
	return parts ?? undefined;
}
