import type { TimeParts } from './time-parts';

const ISO_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Разбирает строго `HH:mm` (24 часа, с ведущими нулями); всё остальное даёт `null`. */
export function parseIsoTime(text: string): TimeParts | null {
	const match = ISO_TIME.exec(text);
	if (!match) {
		return null;
	}
	return { hour: Number(match[1]), minute: Number(match[2]) };
}
