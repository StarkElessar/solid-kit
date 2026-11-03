import type { TimeColumnId } from './time-column-id';
import { moveRow } from './time-columns-state';
import type { TimeRow } from './time-row';

export interface TimeColumnsKeyDownDeps {
	/** Колонки слева направо. */
	columns: () => readonly TimeColumnId[];
	rows: (column: TimeColumnId) => readonly TimeRow[];
	focusId: (column: TimeColumnId) => number;
	isAllowed: (column: TimeColumnId, id: number) => boolean;
	setFocusId: (column: TimeColumnId, id: number) => void;
	focusColumn: (column: TimeColumnId) => void;
}

const VERTICAL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

function columnOf(target: EventTarget | null): TimeColumnId | null {
	if (!(target instanceof Element) || !target.closest('[role="option"]')) {
		return null;
	}
	const value = target.closest('[data-time-column]')?.getAttribute('data-time-column');
	return value === 'hour' || value === 'minute' || value === 'period' ? value : null;
}

/** Клавиатура колонок на корне панели: работает только на строках, кнопка «Сейчас» остаётся обычной кнопкой. */
export function handleTimeColumnsKeyDown(event: KeyboardEvent, deps: TimeColumnsKeyDownDeps): void {
	if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
		return;
	}
	const column = columnOf(event.target);
	if (!column) {
		return;
	}
	if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
		event.preventDefault();
		const columns = deps.columns();
		const neighbor = columns[columns.indexOf(column) + (event.key === 'ArrowRight' ? 1 : -1)];
		if (neighbor) {
			deps.focusColumn(neighbor);
		}
		return;
	}
	if (!VERTICAL_KEYS.has(event.key)) {
		return;
	}
	event.preventDefault();
	const next = moveRow(deps.rows(column), deps.focusId(column), event.key, (id) => deps.isAllowed(column, id));
	if (next !== null) {
		deps.setFocusId(column, next);
		deps.focusColumn(column);
	}
}
