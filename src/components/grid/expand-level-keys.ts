import type { GridGroup } from './grid-group';

/**
 * Разворачивает свёрнутые группы наименьшей глубины среди видимых (группа видима, если развёрнуты все её предки). Нечего разворачивать:
 * возвращается тот же набор.
 */
export function expandLevelKeys<T>(groups: readonly GridGroup<T>[], expanded: ReadonlySet<string>): ReadonlySet<string> {
	const collapsed: { key: string; depth: number }[] = [];
	const visit = (list: readonly GridGroup<T>[], depth: number): void => {
		for (const group of list) {
			if (!expanded.has(group.key)) {
				collapsed.push({ key: group.key, depth });
			}
			else if (group.children.kind === 'groups') {
				visit(group.children.items, depth + 1);
			}
		}
	};
	visit(groups, 0);
	if (collapsed.length === 0) {
		return expanded;
	}
	const shallowest = Math.min(...collapsed.map((item) => item.depth));
	const next = new Set(expanded);
	for (const item of collapsed) {
		if (item.depth === shallowest) {
			next.add(item.key);
		}
	}
	return next;
}
