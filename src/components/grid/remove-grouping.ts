/** Группировка без колонки; отсутствующая возвращает тот же массив. */
export function removeGrouping(list: readonly string[], id: string): readonly string[] {
	return list.includes(id) ? list.filter((item) => item !== id) : list;
}
