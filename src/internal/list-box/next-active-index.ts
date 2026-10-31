import { isRowAvailable } from './is-row-available';
import type { ListRow } from './list-row';

export type ActiveCommand = 'next' | 'previous' | 'first' | 'last' | 'next-page' | 'previous-page';

/** Первая доступная строка с индексом не меньше `from`, иначе -1. */
function findForward<T>(rows: readonly ListRow<T>[], from: number): number {
	for (let index = Math.max(from, 0); index < rows.length; index++) {
		if (isRowAvailable(rows[index])) {
			return index;
		}
	}
	return -1;
}

/** Последняя доступная строка с индексом не больше `from`, иначе -1. */
function findBackward<T>(rows: readonly ListRow<T>[], from: number): number {
	for (let index = Math.min(from, rows.length - 1); index >= 0; index--) {
		if (isRowAvailable(rows[index])) {
			return index;
		}
	}
	return -1;
}

/**
 * Индекс строки, на которую ведёт команда, или -1, если доступных строк нет. Заголовки и отключённые опции пропускаются.
 * Без зацикливания: на краю остаётся `current`. Без текущей строки (`current` вне списка) `next`, `first` и `next-page`
 * дают первую доступную, остальные последнюю.
 */
export function nextActiveIndex<T>(rows: readonly ListRow<T>[], current: number, command: ActiveCommand, pageSize: number): number {
	const first = findForward(rows, 0);
	if (first === -1) {
		return -1;
	}
	const last = findBackward(rows, rows.length - 1);
	const hasCurrent = current >= 0 && current < rows.length;
	const page = Math.max(1, pageSize);

	switch (command) {
		case 'first':
			return first;
		case 'last':
			return last;
		case 'next': {
			if (!hasCurrent) {
				return first;
			}
			const found = findForward(rows, current + 1);
			return found === -1 ? current : found;
		}
		case 'previous': {
			if (!hasCurrent) {
				return last;
			}
			const found = findBackward(rows, current - 1);
			return found === -1 ? current : found;
		}
		case 'next-page': {
			if (!hasCurrent) {
				return first;
			}
			const target = Math.min(current + page, rows.length - 1);
			const ahead = findForward(rows, target);
			if (ahead > current) {
				return ahead;
			}
			const behind = findBackward(rows, target);
			return behind > current ? behind : current;
		}
		case 'previous-page': {
			if (!hasCurrent) {
				return last;
			}
			const target = Math.max(current - page, 0);
			const behind = findBackward(rows, target);
			if (behind !== -1 && behind < current) {
				return behind;
			}
			const ahead = findForward(rows, target);
			return ahead !== -1 && ahead < current ? ahead : current;
		}
	}
}
