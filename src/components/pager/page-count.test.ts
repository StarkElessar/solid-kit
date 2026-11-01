import { describe, expect, it } from 'vitest';

import { pageCount } from './page-count';

describe('pageCount', () => {
	it.each([
		[0, 10, 1],
		[1, 10, 1],
		[10, 10, 1],
		[11, 10, 2],
		[100_000, 50, 2000],
		[100_001, 50, 2001],
		[-5, 10, 1],
		[25, 0, 1],
		[25, -3, 1],
		[Number.NaN, 10, 1],
		[25, Number.NaN, 1],
		[Number.POSITIVE_INFINITY, 10, 1]
	])('total %f, размер %f → %i', (total, size, expected) => {
		expect(pageCount(total, size)).toBe(expected);
	});
});
