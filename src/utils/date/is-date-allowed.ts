import { compareDates } from './compare-dates';
import { MAX_DATE, MIN_DATE } from './date-limits';
import type { DateParts } from './date-parts';
import { formatIsoDate } from './format-iso-date';

/** Можно ли выбрать дату: в пределах 0001-01-01…9999-12-31 и `[min, max]`, и пользовательский предикат её не запрещает. */
export function isDateAllowed(
	date: DateParts,
	min?: DateParts,
	max?: DateParts,
	isDisabled?: ((date: string) => boolean)
): boolean {
	if (compareDates(date, MIN_DATE) < 0 || compareDates(date, MAX_DATE) > 0) {
		return false;
	}
	if ((min && compareDates(date, min) < 0) || (max && compareDates(date, max) > 0)) {
		return false;
	}
	return isDisabled?.(formatIsoDate(date)) !== true;
}
