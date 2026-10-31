export type ItemFilter<T> = (item: T, query: string) => boolean;

/**
 * Strategy клиентского фильтра. Пустой запрос и `filter === false` (внешний поиск: список уже отфильтрован снаружи)
 * возвращают `items` как есть. По умолчанию подпись содержит запрос без учёта регистра.
 */
export function filterItems<T>(
	items: readonly T[],
	query: string,
	filter: ItemFilter<T> | false | undefined,
	getLabel: (item: T) => string
): readonly T[] {
	if (filter === false || query === '') {
		return items;
	}
	if (filter !== undefined) {
		return items.filter((item) => filter(item, query));
	}
	const needle = query.toLocaleLowerCase();
	return items.filter((item) => getLabel(item).toLocaleLowerCase().includes(needle));
}
