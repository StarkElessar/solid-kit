import type { GridGroup } from './grid-group';

/** Сворачивает развёрнутые видимые группы наибольшей глубины. Нечего сворачивать: возвращается тот же набор. */
export function collapseLevelKeys<T>(groups: readonly GridGroup<T>[], expanded: ReadonlySet<string>): ReadonlySet<string> {
	const open: { key: string; depth: number }[] = [];
	const visit = (list: readonly GridGroup<T>[], depth: number): void => {
		for (const group of list) {
			if (!expanded.has(group.key)) {
				continue;
			}
			open.push({ key: group.key, depth });
			if (group.children.kind === 'groups') {
				visit(group.children.items, depth + 1);
			}
		}
	};
	visit(groups, 0);
	if (open.length === 0) {
		return expanded;
	}
	const deepest = Math.max(...open.map((item) => item.depth));
	const next = new Set(expanded);
	for (const item of open) {
		if (item.depth === deepest) {
			next.delete(item.key);
		}
	}
	return next;
}
