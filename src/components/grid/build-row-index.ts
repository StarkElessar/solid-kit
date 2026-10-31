import type { RowKey } from './row-key';

export interface RowIndex {
	/** Ключи строк в порядке `rows`. */
	readonly keys: readonly RowKey[];
	/** Индекс строки по ключу; при повторе ключа индекс первой строки. */
	readonly indexByKey: ReadonlyMap<RowKey, number>;
}

/** Плоский индекс «ключ ↔ строка»: `getRowKey` вызывается один раз на строку (раздел 3 спека). */
export function buildRowIndex<T>(rows: readonly T[], getRowKey: (row: T) => RowKey): RowIndex {
	const keys: RowKey[] = [];
	const indexByKey = new Map<RowKey, number>();
	for (const row of rows) {
		const key = getRowKey(row);
		if (!indexByKey.has(key)) {
			indexByKey.set(key, keys.length);
		}
		keys.push(key);
	}
	return { keys, indexByKey };
}
