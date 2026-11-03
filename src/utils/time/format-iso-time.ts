import type { TimeParts } from './time-parts';

/** Записывает время как `HH:mm`. */
export function formatIsoTime(parts: TimeParts): string {
	return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}
