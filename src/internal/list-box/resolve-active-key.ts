import { isRowAvailable } from './is-row-available';
import type { ListKey, ListRow } from './list-row';

/**
 * После смены данных или запроса: ключ подсветки остаётся, если он среди доступных строк, иначе берётся ключ первой доступной.
 * `undefined`, если доступных строк нет.
 */
export function resolveActiveKey<T>(rows: readonly ListRow<T>[], activeKey: ListKey | undefined): ListKey | undefined {
	let firstKey: ListKey | undefined;
	for (const row of rows) {
		if (row.kind === 'group' || !isRowAvailable(row)) {
			continue;
		}
		if (row.key === activeKey) {
			return activeKey;
		}
		firstKey ??= row.key;
	}
	return firstKey;
}
