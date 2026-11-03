import type { RowKey } from '../grid/row-key';

import type { TreeIndex } from './tree-index';

/**
 * Раскрытые узлы, которым нужна строка «Загрузка…»: идущая догрузка (`loading` от страницы) и ещё не запрошенные дети узла, для
 * которого `hasChildren` сказал, что дети есть. Без `hasChildren` (обычный режим) это просто `loading`.
 */
export function loadingNodeKeys<T>(
	index: TreeIndex<T>,
	expanded: ReadonlySet<RowKey>,
	requested: ReadonlySet<RowKey>,
	loading: ReadonlySet<RowKey>,
	hasChildren: ((row: T) => boolean) | undefined
): ReadonlySet<RowKey> {
	if (hasChildren === undefined) {
		return loading;
	}
	const next = new Set(loading);
	for (const key of expanded) {
		const entry = index.byKey.get(key);
		if (entry !== undefined && !index.children.has(key) && !requested.has(key) && hasChildren(entry.row)) {
			next.add(key);
		}
	}
	return next;
}
