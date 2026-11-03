import { compareDates } from '../date/compare-dates';
import type { DateParts } from '../date/date-parts';

import type { DateTimeParts } from './date-time-parts';
import type { TimeBounds } from './time-bounds';

/** Границы времени для даты: `min` ограничивает время только в день `min`, `max` только в день `max`, в другие дни границ нет. */
export function timeBoundsForDate(date: DateParts, min?: DateTimeParts, max?: DateTimeParts): TimeBounds {
	return {
		...(min && compareDates(date, min.date) === 0 ? { min: min.time } : {}),
		...(max && compareDates(date, max.date) === 0 ? { max: max.time } : {})
	};
}
