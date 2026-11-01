import type { GridColumn } from './grid-column';

/** Начальные наборы скрытых и закреплённых колонок берутся из полей `hidden` и `locked`. */
export function idsWithFlag<T>(columns: readonly GridColumn<T>[], flag: 'hidden' | 'locked'): ReadonlySet<string> {
	return new Set(columns.filter((column) => column[flag] === true).map((column) => column.id));
}
