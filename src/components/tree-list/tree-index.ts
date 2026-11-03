import type { RowKey } from '../grid/row-key';

import type { TreeEntry } from './tree-entry';

export interface TreeIndex<T> {
	/** Корневые узлы в порядке `rows`. */
	readonly roots: readonly TreeEntry<T>[];
	/** Дети по ключу родителя в порядке `rows`. */
	readonly children: ReadonlyMap<RowKey, readonly TreeEntry<T>[]>;
	/** Узел по ключу. */
	readonly byKey: ReadonlyMap<RowKey, TreeEntry<T>>;
}
