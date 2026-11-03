import { parseIsoTime } from './parse-iso-time';
import type { TimeParts } from './time-parts';

/** Разбирает ISO-проп; непустое недопустимое значение это ошибка разработчика: предупреждение в dev и `undefined`. */
export function readTimeProp(component: string, name: string, text: string | null | undefined): TimeParts | undefined {
	if (text === undefined || text === null || text === '') {
		return undefined;
	}
	const parts = parseIsoTime(text);
	if (!parts && import.meta.env.DEV) {
		console.warn(`[solid-kit] ${component}: ${name} must be a time in HH:mm format, got "${text}".`);
	}
	return parts ?? undefined;
}
