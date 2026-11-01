/** Есть ли в итогах значение для колонки: ключ собственный и не `undefined`. */
export function hasTotalsValue(columnId: string, values: Readonly<Record<string, unknown>>): boolean {
	// hasOwn: колонка с id вроде `constructor` не должна читать унаследованные ключи
	return Object.hasOwn(values, columnId) && values[columnId] !== undefined;
}
