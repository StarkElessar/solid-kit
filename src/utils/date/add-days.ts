import { clampDate } from './clamp-date';
import { MAX_DATE, MIN_DATE } from './date-limits';
import type { DateParts } from './date-parts';
import { fromUtcTime } from './from-utc-time';
import { toUtcTime } from './to-utc-time';

const DAY_MS = 86_400_000;

/** Сдвиг на `count` суток (в UTC, поэтому переход на летнее время ничего не меняет); результат в пределах 0001-01-01…9999-12-31. */
export function addDays(parts: DateParts, count: number): DateParts {
	return clampDate(fromUtcTime(toUtcTime(parts) + count * DAY_MS), MIN_DATE, MAX_DATE);
}
