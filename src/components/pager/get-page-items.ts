import type { PagerItem } from './pager-item';

const SLOTS = 7;
const GAP: PagerItem = { kind: 'gap' };

function pageItem(page: number): PagerItem {
	return { kind: 'page', page };
}

/**
 * Ряд страниц: до семи страниц показываются все, иначе ровно семь элементов (ширина полосы не прыгает):
 * `1 2 3 4 5 … N` у начала, `1 … N-4 N-3 N-2 N-1 N` у конца, `1 … p-1 p p+1 … N` посередине.
 */
export function getPageItems(page: number, count: number): PagerItem[] {
	if (count <= SLOTS) {
		return Array.from({ length: count }, (_, index) => pageItem(index + 1));
	}
	if (page <= 4) {
		return [pageItem(1), pageItem(2), pageItem(3), pageItem(4), pageItem(5), GAP, pageItem(count)];
	}
	if (page >= count - 3) {
		return [pageItem(1), GAP, pageItem(count - 4), pageItem(count - 3), pageItem(count - 2), pageItem(count - 1), pageItem(count)];
	}
	return [pageItem(1), GAP, pageItem(page - 1), pageItem(page), pageItem(page + 1), GAP, pageItem(count)];
}
