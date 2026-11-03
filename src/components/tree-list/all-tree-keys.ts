import type { RowKey } from '../grid/row-key';

import type { TreeIndex } from './tree-index';

/**
 * К раскрытым добавляет все узлы с загруженными детьми: «развернуть все» не трогает незагруженные узлы (иначе лавина запросов) и не
 * сворачивает раскрытые. Всё уже раскрыто: возвращается тот же набор.
 */
export function allTreeKeys<T>(index: TreeIndex<T>, expanded: ReadonlySet<RowKey>): ReadonlySet<RowKey> {
	const missing = [...index.children.keys()].filter((key) => !expanded.has(key));
	return missing.length === 0 ? expanded : new Set([...expanded, ...missing]);
}
