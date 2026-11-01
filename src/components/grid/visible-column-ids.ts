import type { GridColumn } from './grid-column';

/** Id нескрытых колонок в порядке `columns`. */
export function visibleColumnIds<T>(columns: readonly GridColumn<T>[], hidden: ReadonlySet<string>): readonly string[] {
	return columns.filter((column) => !hidden.has(column.id)).map((column) => column.id);
}
