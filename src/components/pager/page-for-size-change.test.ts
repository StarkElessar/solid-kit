import { describe, expect, it } from 'vitest';

import { pageForSizeChange } from './page-for-size-change';

describe('pageForSizeChange', () => {
	it.each([
		[3, 10, 50, 1],
		[3, 50, 10, 11],
		[1, 10, 2000, 1],
		[1, 2000, 10, 1],
		[7, 20, 20, 7],
		[6, 10, 20, 3],
		[5, 10, 20, 3],
		[2, 20, 10, 3]
	])('страница %i: %i → %i даёт страницу %i', (page, oldSize, newSize, expected) => {
		expect(pageForSizeChange(page, oldSize, newSize)).toBe(expected);
	});

	it('первая запись прежней страницы остаётся на новой', () => {
		for (const [oldSize, newSize] of [[10, 50], [50, 10], [20, 200], [200, 20], [1000, 500]] as const) {
			for (const page of [1, 2, 3, 7, 40]) {
				const first = (page - 1) * oldSize + 1;
				const next = pageForSizeChange(page, oldSize, newSize);
				expect(first).toBeGreaterThanOrEqual((next - 1) * newSize + 1);
				expect(first).toBeLessThanOrEqual(next * newSize);
			}
		}
	});
});
