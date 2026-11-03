import type { FlatItems } from '../grid/flat-items';
import type { GridItem } from '../grid/grid-item';
import type { RowKey } from '../grid/row-key';

import type { TreeEntry } from './tree-entry';
import type { TreeIndex } from './tree-index';

interface Frame<T> {
	list: readonly TreeEntry<T>[];
	next: number;
	level: number;
}

/**
 * Дерево в плоский список видимых строк «родитель, затем его дети». Узел виден, если раскрыты все его предки; раскрыть можно только
 * раскрываемый узел (есть дети или `hasChildren`). Развёрнутый узел без детей, чей ключ в `loading`, получает заглушку. Обход
 * итеративный: глубокая цепочка не переполняет стек.
 */
export function flattenTree<T>(
	index: TreeIndex<T>,
	expanded: ReadonlySet<RowKey>,
	hasChildren: ((row: T) => boolean) | undefined,
	loading: ReadonlySet<RowKey>
): FlatItems<T> {
	const items: GridItem<T>[] = [];
	const rows: T[] = [];
	const stack: Frame<T>[] = [{ list: index.roots, next: 0, level: 0 }];
	for (let frame = stack[stack.length - 1]; frame !== undefined; frame = stack[stack.length - 1]) {
		const entry = frame.list[frame.next];
		if (entry === undefined) {
			stack.pop();
			continue;
		}
		const position = frame.next + 1;
		frame.next = position;
		const kids = index.children.get(entry.key);
		const expandable = kids !== undefined || hasChildren?.(entry.row) === true;
		const open = expandable && expanded.has(entry.key);
		items.push({
			kind: 'row',
			row: entry.row,
			rowIndex: rows.length,
			level: frame.level,
			node: { key: entry.key, expandable, expanded: open, setSize: frame.list.length, posInSet: position }
		});
		rows.push(entry.row);
		if (open) {
			if (kids !== undefined) {
				stack.push({ list: kids, next: 0, level: frame.level + 1 });
			}
			else if (loading.has(entry.key)) {
				items.push({ kind: 'loading', key: entry.key, level: frame.level + 1 });
			}
		}
	}
	return { items, rows };
}
