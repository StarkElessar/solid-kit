import { isRowAvailable } from './is-row-available';
import type { ListKey, ListRow } from './list-row';

/** Индекс первой выбранной доступной строки, иначе первой доступной, иначе -1 (при открытии список прокручивается к выбранному). */
export function initialActiveIndex<T>(rows: readonly ListRow<T>[], selectedKeys: readonly ListKey[]): number {
	if (selectedKeys.length > 0) {
		const selected = new Set<ListKey>(selectedKeys);
		const index = rows.findIndex((row) => row.kind !== 'group' && isRowAvailable(row) && selected.has(row.key));
		if (index !== -1) {
			return index;
		}
	}
	return rows.findIndex((row) => isRowAvailable(row));
}
