import type { DateParts } from '../../utils/date/date-parts';

import type { CalendarView } from './calendar-view';
import { findEnabledDate } from './find-enabled-date';
import { navigateByKey } from './navigate-by-key';

export interface CalendarKeyDownDeps {
	view: () => CalendarView;
	focused: () => DateParts;
	firstDay: () => number;
	isDisabled: (view: CalendarView, date: DateParts) => boolean;
	isInRange: (view: CalendarView, date: DateParts) => boolean;
	focusDate: (date: DateParts) => void;
	back: () => void;
	focusCell: () => void;
}

/** Клавиатура календаря на корне: работает только на ячейках, кнопки шапки и подвала остаются обычными кнопками. */
export function handleCalendarKeyDown(event: KeyboardEvent, deps: CalendarKeyDownDeps): void {
	if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
		return;
	}
	if (!(event.target instanceof Element) || !event.target.closest('[role="gridcell"]')) {
		return;
	}
	const view = deps.view();
	if (event.key === 'Backspace' && view !== 'days') {
		event.preventDefault();
		deps.back();
		return;
	}
	const move = navigateByKey(view, event.key, event.shiftKey, deps.focused(), deps.firstDay());
	if (!move) {
		return;
	}
	event.preventDefault();
	const target = findEnabledDate(
		move.target,
		move.direction,
		view,
		(date) => deps.isDisabled(view, date),
		(date) => deps.isInRange(view, date)
	);
	if (target) {
		deps.focusDate(target);
		deps.focusCell();
	}
}
