import { compareDates } from '../../utils/date/compare-dates';
import { MAX_DATE, MIN_DATE } from '../../utils/date/date-limits';
import type { DateParts } from '../../utils/date/date-parts';
import { daysInMonth } from '../../utils/date/days-in-month';

import type { CalendarView } from './calendar-view';

interface Period {
	readonly from: DateParts;
	readonly to: DateParts;
}

function periodAfterShift(view: CalendarView, date: DateParts, direction: -1 | 1): Period {
	if (view === 'days') {
		const index = date.year * 12 + (date.month - 1) + direction;
		const year = Math.floor(index / 12);
		const month = index - year * 12 + 1;
		return { from: { year, month, day: 1 }, to: { year, month, day: daysInMonth(year, month) } };
	}
	if (view === 'months') {
		const year = date.year + direction;
		return { from: { year, month: 1, day: 1 }, to: { year, month: 12, day: 31 } };
	}
	const start = Math.floor(date.year / 10) * 10 + direction * 10;
	return { from: { year: start, month: 1, day: 1 }, to: { year: start + 9, month: 12, day: 31 } };
}

/** Есть ли в соседнем периоде (месяц, год или десятилетие) хоть одна дата из `[min, max]` и из 0001-01-01…9999-12-31. */
export function isPeriodReachable(
	view: CalendarView,
	date: DateParts,
	direction: -1 | 1,
	min?: DateParts,
	max?: DateParts
): boolean {
	const { from, to } = periodAfterShift(view, date, direction);
	const lower = min && compareDates(min, MIN_DATE) > 0 ? min : MIN_DATE;
	const upper = max && compareDates(max, MAX_DATE) < 0 ? max : MAX_DATE;
	return compareDates(to, lower) >= 0 && compareDates(from, upper) <= 0;
}
