import type { RowKey } from '../grid/row-key';

/** Строка дерева вместе с её ключом: ключ считается один раз при построении индекса. */
export interface TreeEntry<T> {
	row: T;
	key: RowKey;
}
