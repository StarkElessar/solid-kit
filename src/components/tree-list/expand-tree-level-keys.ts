import type { GridItem } from '../grid/grid-item';
import type { RowKey } from '../grid/row-key';

/** Разворачивает свёрнутые раскрываемые видимые узлы наименьшей глубины. Нечего разворачивать: возвращается тот же набор. */
export function expandTreeLevelKeys<T>(items: readonly GridItem<T>[], expanded: ReadonlySet<RowKey>): ReadonlySet<RowKey> {
	let shallowest = Number.POSITIVE_INFINITY;
	for (const item of items) {
		if (item.kind === 'row' && item.node?.expandable === true && !item.node.expanded) {
			shallowest = Math.min(shallowest, item.level);
		}
	}
	if (shallowest === Number.POSITIVE_INFINITY) {
		return expanded;
	}
	const next = new Set(expanded);
	for (const item of items) {
		if (item.kind === 'row' && item.node?.expandable === true && !item.node.expanded && item.level === shallowest) {
			next.add(item.node.key);
		}
	}
	return next;
}
