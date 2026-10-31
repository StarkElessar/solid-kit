/** Равенство списков по элементам (`===`): мемо не пересоздаёт строки и колонки, когда изменился только контейнер. */
export function sameItems<V>(first: readonly V[], second: readonly V[]): boolean {
	return first.length === second.length && first.every((item, index) => item === second[index]);
}
