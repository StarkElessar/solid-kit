/** Колонка в конец группировки; уже стоящая возвращает тот же массив. */
export function addGrouping(list: readonly string[], id: string): readonly string[] {
	return list.includes(id) ? list : [...list, id];
}
