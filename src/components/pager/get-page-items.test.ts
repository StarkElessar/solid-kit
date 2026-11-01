import { describe, expect, it } from 'vitest';

import { getPageItems } from './get-page-items';
import type { PagerItem } from './pager-item';

function show(items: readonly PagerItem[]): string {
	return items.map((item) => (item.kind === 'gap' ? '…' : String(item.page))).join(' ');
}

describe('getPageItems', () => {
	it.each([
		[1, 1, '1'],
		[1, 3, '1 2 3'],
		[4, 7, '1 2 3 4 5 6 7'],
		[1, 8, '1 2 3 4 5 … 8'],
		[4, 8, '1 2 3 4 5 … 8'],
		[5, 8, '1 … 4 5 6 7 8'],
		[8, 8, '1 … 4 5 6 7 8'],
		[1, 20, '1 2 3 4 5 … 20'],
		[4, 20, '1 2 3 4 5 … 20'],
		[5, 20, '1 … 4 5 6 … 20'],
		[10, 20, '1 … 9 10 11 … 20'],
		[16, 20, '1 … 15 16 17 … 20'],
		[17, 20, '1 … 16 17 18 19 20'],
		[20, 20, '1 … 16 17 18 19 20'],
		[1000, 2000, '1 … 999 1000 1001 … 2000']
	])('страница %i из %i → %s', (page, count, expected) => {
		expect(show(getPageItems(page, count))).toBe(expected);
	});

	it('при количестве страниц больше семи всегда ровно семь элементов', () => {
		for (const count of [8, 9, 20, 2000]) {
			for (let page = 1; page <= count; page += 1) {
				expect(getPageItems(page, count)).toHaveLength(7);
			}
		}
	});

	it('первая и последняя страницы всегда на краях ряда', () => {
		for (let page = 1; page <= 30; page += 1) {
			const items = getPageItems(page, 30);
			expect(items[0]).toEqual({ kind: 'page', page: 1 });
			expect(items.at(-1)).toEqual({ kind: 'page', page: 30 });
		}
	});
});
