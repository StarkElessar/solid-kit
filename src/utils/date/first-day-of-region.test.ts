import { describe, expect, it } from 'vitest';

import { firstDayOfRegion } from './first-day-of-region';

describe('firstDayOfRegion', () => {
	it.each([
		['US', 0], ['JP', 0], ['BR', 0], ['RU', 1], ['DE', 1], ['EG', 6], ['AE', 6], ['ZZ', 1], ['', 1], ['us', 0], ['eg', 6]
	])('%j: %i', (region, expected) => {
		expect(firstDayOfRegion(region)).toBe(expected);
	});
});
