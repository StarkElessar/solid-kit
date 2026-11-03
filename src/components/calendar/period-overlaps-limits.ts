import { compareDates } from '../../utils/date/compare-dates';
import { MAX_DATE, MIN_DATE } from '../../utils/date/date-limits';
import type { DateParts } from '../../utils/date/date-parts';

/** Есть ли в периоде `[from, to]` хоть одна дата из `[min, max]` и из 0001-01-01…9999-12-31. Годы периода могут выходить за 1–9999. */
export function periodOverlapsLimits(from: DateParts, to: DateParts, min?: DateParts, max?: DateParts): boolean {
	const lower = min && compareDates(min, MIN_DATE) > 0 ? min : MIN_DATE;
	const upper = max && compareDates(max, MAX_DATE) < 0 ? max : MAX_DATE;
	return compareDates(to, lower) >= 0 && compareDates(from, upper) <= 0;
}
