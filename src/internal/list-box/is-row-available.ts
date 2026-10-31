import type { ListRow } from './list-row';

/** Строка, на которую можно поставить подсветку: опция без `disabled` или строка «Все». */
export function isRowAvailable<T>(row: ListRow<T> | undefined): boolean {
	return row !== undefined && (row.kind === 'all' || (row.kind === 'option' && !row.disabled));
}
