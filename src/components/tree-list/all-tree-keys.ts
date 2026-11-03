import type { RowKey } from '../grid/row-key';

import type { TreeIndex } from './tree-index';

/** Ключи всех узлов с загруженными детьми: «развернуть все» не трогает незагруженные узлы (иначе лавина запросов). */
export function allTreeKeys<T>(index: TreeIndex<T>): ReadonlySet<RowKey> {
	return new Set(index.children.keys());
}
