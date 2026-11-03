import { addMonths } from '../../utils/date/add-months';
import { addYears } from '../../utils/date/add-years';
import type { DateParts } from '../../utils/date/date-parts';

import type { CalendarView } from './calendar-view';

const YEARS_STEP = 10;

/** Шаг стрелок шапки: дни ±1 месяц, месяцы ±1 год, годы ±10 лет (день ужимается до длины месяца). */
export function shiftFocused(view: CalendarView, date: DateParts, direction: -1 | 1): DateParts {
	if (view === 'days') {
		return addMonths(date, direction);
	}
	return addYears(date, view === 'months' ? direction : direction * YEARS_STEP);
}
