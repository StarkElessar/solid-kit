import type { GridSort } from './grid-sort';

/** Цикл сортировки по клику на заголовок: asc → desc → сброс; другая колонка (или сброс) начинает с asc. */
export function nextSort(current: GridSort | null, columnId: string): GridSort | null {
	if (current === null || current.columnId !== columnId) {
		return { columnId, direction: 'asc' };
	}
	return current.direction === 'asc' ? { columnId, direction: 'desc' } : null;
}
