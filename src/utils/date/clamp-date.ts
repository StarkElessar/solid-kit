import { compareDates } from './compare-dates';
import type { DateParts } from './date-parts';

/** Зажимает дату в `[min, max]`; отсутствующая граница не ограничивает. */
export function clampDate(date: DateParts, min?: DateParts, max?: DateParts): DateParts {
	if (min && compareDates(date, min) < 0) {
		return min;
	}
	if (max && compareDates(date, max) > 0) {
		return max;
	}
	return date;
}
