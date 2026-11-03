import type { DateParts } from '../date/date-parts';
import { isDateAllowed } from '../date/is-date-allowed';
import { isTimeAllowed } from '../time/is-time-allowed';
import { minuteOptions } from '../time/minute-options';
import type { TimeParts } from '../time/time-parts';

import type { DateTimeRules } from './date-time-rules';
import { timeBoundsForDate } from './time-bounds-for-date';

const MINUTES_IN_DAY = 24 * 60;

/**
 * Время для выбранной даты: прежнее, если оно допустимо, иначе ближайшее допустимое время суток на сетке `step` (при равном расстоянии
 * раннее). `null`, если дата не разрешена или в этот день нет ни одного допустимого времени.
 */
export function fitTimeToDate(date: DateParts, time: TimeParts, rules: DateTimeRules): TimeParts | null {
	if (!isDateAllowed(date, rules.min?.date, rules.max?.date, rules.isDateDisabled)) {
		return null;
	}
	const { min, max } = timeBoundsForDate(date, rules.min, rules.max);
	if (isTimeAllowed(time, min, max, rules.isTimeDisabled)) {
		return time;
	}
	const target = time.hour * 60 + time.minute;
	let best: TimeParts | null = null;
	let bestDistance = MINUTES_IN_DAY;
	for (let hour = 0; hour < 24; hour += 1) {
		for (const minute of minuteOptions(rules.step)) {
			const candidate = { hour, minute };
			const distance = Math.abs(hour * 60 + minute - target);
			if (distance < bestDistance && isTimeAllowed(candidate, min, max, rules.isTimeDisabled)) {
				best = candidate;
				bestDistance = distance;
			}
		}
	}
	return best;
}
