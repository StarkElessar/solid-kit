import type { FlatItems } from './flat-items';
import type { GridGroup } from './grid-group';
import type { GridItem } from './grid-item';

/**
 * Дерево групп в плоский список «заголовок → строки или вложенные группы → подвал». Свёрнутая группа даёт заголовок и подвал, без
 * содержимого; ещё не загруженная развёрнутая даёт заглушку; подвал есть, только если у группы есть агрегаты.
 */
export function flattenGroups<T>(groups: readonly GridGroup<T>[], expanded: ReadonlySet<string>): FlatItems<T> {
	const items: GridItem<T>[] = [];
	const rows: T[] = [];
	const visit = (list: readonly GridGroup<T>[], level: number): void => {
		for (const group of list) {
			const open = expanded.has(group.key);
			items.push({ kind: 'group', group, level, expanded: open });
			if (open) {
				const children = group.children;
				if (children.kind === 'groups') {
					visit(children.items, level + 1);
				}
				else if (children.kind === 'rows') {
					for (const row of children.items) {
						items.push({ kind: 'row', row, rowIndex: rows.length, level: level + 1 });
						rows.push(row);
					}
				}
				else {
					items.push({ kind: 'loading', key: group.key, level: level + 1 });
				}
			}
			if (group.aggregates !== undefined) {
				items.push({ kind: 'footer', group, level });
			}
		}
	};
	visit(groups, 0);
	return { items, rows };
}
