import { describe, expect, it } from 'vitest';

import { pageRange } from './page-range';

describe('pageRange', () => {
	it.each([
		[1, 20, 1250, { from: 1, to: 20, total: 1250 }],
		[2, 20, 1250, { from: 21, to: 40, total: 1250 }],
		[63, 20, 1250, { from: 1241, to: 1250, total: 1250 }],
		[1, 10, 7, { from: 1, to: 7, total: 7 }],
		[1, 10, 0, { from: 0, to: 0, total: 0 }],
		[1, 10, -3, { from: 0, to: 0, total: 0 }]
	])('страница %i, размер %i, всего %i', (page, size, total, expected) => {
		expect(pageRange(page, size, total)).toEqual(expected);
	});
});
