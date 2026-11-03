import { addMonths } from './add-months';
import type { DateParts } from './date-parts';

/** Сдвиг на `count` лет; 29 февраля в невисокосном году становится 28 февраля. */
export function addYears(parts: DateParts, count: number): DateParts {
	return addMonths(parts, count * 12);
}
