import type { RowKey } from '../grid/row-key';

import type { TreeEntry } from './tree-entry';
import type { TreeIndex } from './tree-index';

/**
 * Индекс «родитель → дети» за один проход O(n). Родителя нет в списке: узел корневой. Цикл разрывается: первый его узел по порядку
 * `rows` становится корнем. Повтор ключа пропускается (как в `buildRowIndex`, учитывается первая строка).
 */
export function buildTreeIndex<T>(
	rows: readonly T[],
	getRowKey: (row: T) => RowKey,
	getParentKey: (row: T) => RowKey | null | undefined
): TreeIndex<T> {
	const entries: TreeEntry<T>[] = [];
	const byKey = new Map<RowKey, TreeEntry<T>>();
	for (const row of rows) {
		const key = getRowKey(row);
		if (!byKey.has(key)) {
			const entry = { row, key };
			byKey.set(key, entry);
			entries.push(entry);
		}
	}
	const roots: TreeEntry<T>[] = [];
	const children = new Map<RowKey, TreeEntry<T>[]>();
	const parentOf = new Map<RowKey, RowKey>();
	for (const entry of entries) {
		const parent = getParentKey(entry.row);
		if (parent === undefined || parent === null || parent === entry.key || !byKey.has(parent)) {
			roots.push(entry);
			continue;
		}
		parentOf.set(entry.key, parent);
		const siblings = children.get(parent);
		if (siblings === undefined) {
			children.set(parent, [entry]);
		}
		else {
			siblings.push(entry);
		}
	}
	// узлы цикла недостижимы из корней: первый из них по порядку отцепляется от родителя и становится корнем
	const reached = new Set<RowKey>();
	const mark = (start: TreeEntry<T>): void => {
		const stack = [start];
		for (let entry = stack.pop(); entry !== undefined; entry = stack.pop()) {
			if (!reached.has(entry.key)) {
				reached.add(entry.key);
				for (const child of children.get(entry.key) ?? []) {
					stack.push(child);
				}
			}
		}
	};
	for (const root of roots) {
		mark(root);
	}
	for (const entry of entries) {
		if (reached.has(entry.key)) {
			continue;
		}
		const parent = parentOf.get(entry.key);
		const siblings = parent === undefined ? undefined : children.get(parent);
		siblings?.splice(siblings.indexOf(entry), 1);
		roots.push(entry);
		mark(entry);
	}
	return { roots, children, byKey };
}
