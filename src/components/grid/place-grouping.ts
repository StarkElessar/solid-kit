/**
 * Колонка `id` на позиции-щели `slot` (щель считается по списку до перестановки: 0 перед первым чипом, `list.length` после последнего).
 * Уже стоящая колонка переносится; положение не изменилось: тот же массив.
 */
export function placeGrouping(list: readonly string[], id: string, slot: number): readonly string[] {
	const from = list.indexOf(id);
	const rest = list.filter((item) => item !== id);
	const target = Math.min(Math.max(from !== -1 && from < slot ? slot - 1 : slot, 0), rest.length);
	if (from === target) {
		return list;
	}
	return [...rest.slice(0, target), id, ...rest.slice(target)];
}
