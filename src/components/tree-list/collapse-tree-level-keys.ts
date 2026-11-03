import type { GridItem } from '../grid/grid-item';
import type { RowKey } from '../grid/row-key';

/** Сворачивает развёрнутые видимые узлы наибольшей глубины. Нечего сворачивать: возвращается тот же набор. */
export function collapseTreeLevelKeys<T>(items: readonly GridItem<T>[], expanded: ReadonlySet<RowKey>): ReadonlySet<RowKey> {
	let deepest = -1;
	for (const item of items) {
		if (item.kind === 'row' && item.node?.expanded === true) {
			deepest = Math.max(deepest, item.level);
		}
	}
	if (deepest === -1) {
		return expanded;
	}
	const next = new Set(expanded);
	for (const item of items) {
		if (item.kind === 'row' && item.node?.expanded === true && item.level === deepest) {
			next.delete(item.node.key);
		}
	}
	return next;
}
