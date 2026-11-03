import type { TimeParts } from './time-parts';

/** Текущее время суток по локальным часам; единственное место со временем часового пояса. */
export function nowTime(): TimeParts {
	const now = new Date();
	return { hour: now.getHours(), minute: now.getMinutes() };
}
