import { isDateAllowed } from '../date/is-date-allowed';
import { isTimeAllowed } from '../time/is-time-allowed';

import { compareDateTimes } from './compare-date-times';
import type { DateTimeParts } from './date-time-parts';
import type { DateTimeRules } from './date-time-rules';

/** Значение допустимо: дата разрешена, момент внутри `min`…`max` (включительно), время не отключено предикатом. */
export function isDateTimeAllowed(value: DateTimeParts, rules: DateTimeRules): boolean {
	if (!isDateAllowed(value.date, rules.min?.date, rules.max?.date, rules.isDateDisabled)) {
		return false;
	}
	if ((rules.min && compareDateTimes(value, rules.min) < 0) || (rules.max && compareDateTimes(value, rules.max) > 0)) {
		return false;
	}
	return isTimeAllowed(value.time, undefined, undefined, rules.isTimeDisabled);
}
