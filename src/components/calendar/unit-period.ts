import type { DateParts } from '../../utils/date/date-parts';
import { daysInMonth } from '../../utils/date/days-in-month';

import type { CalendarView } from './calendar-view';

export interface UnitPeriod {
	readonly from: DateParts;
	readonly to: DateParts;
}

/** Период ячейки режима: день, месяц или год, в который входит `date`. */
export function unitPeriod(view: CalendarView, date: DateParts): UnitPeriod {
	if (view === 'days') {
		return { from: date, to: date };
	}
	if (view === 'months') {
		const { year, month } = date;
		return { from: { year, month, day: 1 }, to: { year, month, day: daysInMonth(year, month) } };
	}
	return { from: { year: date.year, month: 1, day: 1 }, to: { year: date.year, month: 12, day: 31 } };
}
