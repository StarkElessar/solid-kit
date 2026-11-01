import type { GridGroup } from './grid-group';

/** Ключи всех групп дерева: набор для «развернуть все». */
export function allGroupKeys<T>(groups: readonly GridGroup<T>[]): ReadonlySet<string> {
	const keys = new Set<string>();
	const visit = (list: readonly GridGroup<T>[]): void => {
		for (const group of list) {
			keys.add(group.key);
			if (group.children.kind === 'groups') {
				visit(group.children.items);
			}
		}
	};
	visit(groups);
	return keys;
}
