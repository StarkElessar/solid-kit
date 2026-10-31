import type { ListKey, ListRow } from './list-row';

export interface FlattenOptions<T> {
	getKey: (item: T) => ListKey;
	getLabel: (item: T) => string;
	groupBy?: ((item: T) => string) | undefined;
	isItemDisabled?: ((item: T) => boolean) | undefined;
	/** Ключ строки «Все»: если задан и есть хотя бы одна опция, она идёт первой. Не должен совпадать с ключом опции. */
	allKey?: ListKey | undefined;
}

/**
 * Разворачивает элементы в плоский список строк: заголовки групп и опции. Группы идут в порядке первого появления значения `groupBy`,
 * внутри группы порядок исходный; заголовок пустой группы не создаётся. `getLabel` вызывается один раз на элемент.
 */
export function flattenRows<T>(items: readonly T[], options: FlattenOptions<T>): readonly ListRow<T>[] {
	if (items.length === 0) {
		return [];
	}
	const rows: ListRow<T>[] = [];
	if (options.allKey !== undefined) {
		rows.push({ kind: 'all', key: options.allKey });
	}
	let optionIndex = 0;
	const toOption = (item: T, groupIndex: number): ListRow<T> => ({
		kind: 'option',
		key: options.getKey(item),
		item,
		label: options.getLabel(item),
		disabled: options.isItemDisabled?.(item) ?? false,
		optionIndex: optionIndex++,
		groupIndex
	});

	const groupBy = options.groupBy;
	if (groupBy === undefined) {
		for (const item of items) {
			rows.push(toOption(item, -1));
		}
		return rows;
	}

	const groups = new Map<string, T[]>();
	for (const item of items) {
		const name = groupBy(item);
		const members = groups.get(name);
		if (members === undefined) {
			groups.set(name, [item]);
		}
		else {
			members.push(item);
		}
	}
	let groupIndex = 0;
	for (const [label, members] of groups) {
		rows.push({ kind: 'group', key: label, label, groupIndex });
		for (const member of members) {
			rows.push(toOption(member, groupIndex));
		}
		groupIndex++;
	}
	return rows;
}
