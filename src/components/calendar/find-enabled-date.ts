import { addDays } from '../../utils/date/add-days';
import { addMonths } from '../../utils/date/add-months';
import { addYears } from '../../utils/date/add-years';
import type { DateParts } from '../../utils/date/date-parts';

import type { CalendarView } from './calendar-view';

/** Сколько ячеек подряд можно пропустить, прежде чем сдаться (защита от предиката, отключающего всё). */
export const MAX_SKIP = 800;

function stepOf(view: CalendarView, date: DateParts, direction: -1 | 1): DateParts {
	if (view === 'days') {
		return addDays(date, direction);
	}
	return view === 'months' ? addMonths(date, direction) : addYears(date, direction);
}

/**
 * Ближайшая доступная дата от `start` включительно в направлении `direction` шагом ячейки режима (день, месяц, год).
 * `null`, если путь упёрся в границы диапазона (`inRange` ложно) или доступной ячейки нет в пределах `MAX_SKIP` шагов.
 */
export function findEnabledDate(
	start: DateParts,
	direction: -1 | 1,
	view: CalendarView,
	isDisabled: (date: DateParts) => boolean,
	inRange: (date: DateParts) => boolean
): DateParts | null {
	let current = start;
	for (let skipped = 0; skipped < MAX_SKIP; skipped += 1) {
		if (!inRange(current)) {
			return null;
		}
		if (!isDisabled(current)) {
			return current;
		}
		current = stepOf(view, current, direction);
	}
	return null;
}
