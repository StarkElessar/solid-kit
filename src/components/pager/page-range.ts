import type { PagerRange } from './pager-range';

/** Диапазон записей страницы; `page` должна быть уже зажата в границы (см. `clampPage`). */
export function pageRange(page: number, pageSize: number, total: number): PagerRange {
	if (total <= 0) {
		return { from: 0, to: 0, total: 0 };
	}
	return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), total };
}
