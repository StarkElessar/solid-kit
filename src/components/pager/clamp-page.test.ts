import { describe, expect, it } from 'vitest';

import { clampPage } from './clamp-page';

describe('clampPage', () => {
	it.each([
		[1, 5, 1],
		[3, 5, 3],
		[5, 5, 5],
		[6, 5, 5],
		[0, 5, 1],
		[-4, 5, 1],
		[2.7, 5, 2],
		[Number.NaN, 5, 1],
		[Number.POSITIVE_INFINITY, 5, 1],
		[3, 0, 1]
	])('страница %f из %i → %i', (page, count, expected) => {
		expect(clampPage(page, count)).toBe(expected);
	});
});
