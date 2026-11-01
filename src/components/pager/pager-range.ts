/** Диапазон записей текущей страницы для сводки: номера с 1, при пустой выборке `from` и `to` равны 0. */
export interface PagerRange {
	from: number;
	to: number;
	total: number;
}
