import { addDays } from '../../utils/date/add-days';
import { addMonths } from '../../utils/date/add-months';
import { addYears } from '../../utils/date/add-years';
import type { DateParts } from '../../utils/date/date-parts';
import { weekdayOf } from '../../utils/date/weekday-of';

import type { CalendarView } from './calendar-view';

export interface KeyMove {
	/** Куда хотел бы попасть фокус. */
	readonly target: DateParts;
	/** В какую сторону искать доступную ячейку, если `target` отключена. */
	readonly direction: -1 | 1;
}

const YEARS_PER_BLOCK = 10;
const GRID_COLUMNS = 3;

function move(target: DateParts, direction: -1 | 1): KeyMove {
	return { target, direction };
}

function daysMove(key: string, shiftKey: boolean, date: DateParts, firstDay: number): KeyMove | null {
	const weekOffset = (weekdayOf(date) - firstDay + 7) % 7;
	switch (key) {
		case 'ArrowLeft': return move(addDays(date, -1), -1);
		case 'ArrowRight': return move(addDays(date, 1), 1);
		case 'ArrowUp': return move(addDays(date, -7), -1);
		case 'ArrowDown': return move(addDays(date, 7), 1);
		case 'Home': return move(addDays(date, -weekOffset), 1);
		case 'End': return move(addDays(date, 6 - weekOffset), -1);
		case 'PageUp': return move(shiftKey ? addYears(date, -1) : addMonths(date, -1), -1);
		case 'PageDown': return move(shiftKey ? addYears(date, 1) : addMonths(date, 1), 1);
		default: return null;
	}
}

function monthsMove(key: string, date: DateParts): KeyMove | null {
	switch (key) {
		case 'ArrowLeft': return move(addMonths(date, -1), -1);
		case 'ArrowRight': return move(addMonths(date, 1), 1);
		case 'ArrowUp': return move(addMonths(date, -GRID_COLUMNS), -1);
		case 'ArrowDown': return move(addMonths(date, GRID_COLUMNS), 1);
		case 'Home': return move(addMonths(date, 1 - date.month), 1);
		case 'End': return move(addMonths(date, 12 - date.month), -1);
		case 'PageUp': return move(addYears(date, -1), -1);
		case 'PageDown': return move(addYears(date, 1), 1);
		default: return null;
	}
}

function yearsMove(key: string, date: DateParts): KeyMove | null {
	const blockStart = Math.floor(date.year / YEARS_PER_BLOCK) * YEARS_PER_BLOCK;
	switch (key) {
		case 'ArrowLeft': return move(addYears(date, -1), -1);
		case 'ArrowRight': return move(addYears(date, 1), 1);
		case 'ArrowUp': return move(addYears(date, -GRID_COLUMNS), -1);
		case 'ArrowDown': return move(addYears(date, GRID_COLUMNS), 1);
		case 'Home': return move(addYears(date, blockStart - date.year), 1);
		case 'End': return move(addYears(date, blockStart + YEARS_PER_BLOCK - 1 - date.year), -1);
		case 'PageUp': return move(addYears(date, -YEARS_PER_BLOCK), -1);
		case 'PageDown': return move(addYears(date, YEARS_PER_BLOCK), 1);
		default: return null;
	}
}

/** Клавиша навигации в режиме `view`: куда переходит фокус; `null` для остальных клавиш (спека, раздел 5). */
export function navigateByKey(view: CalendarView, key: string, shiftKey: boolean, date: DateParts, firstDay: number): KeyMove | null {
	if (view === 'days') {
		return daysMove(key, shiftKey, date, firstDay);
	}
	return view === 'months' ? monthsMove(key, date) : yearsMove(key, date);
}
