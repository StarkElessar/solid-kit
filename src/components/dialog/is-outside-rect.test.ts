import { describe, expect, it } from 'vitest';

import { isOutsideRect } from './is-outside-rect';

const RECT = { left: 100, right: 300, top: 50, bottom: 250 };

describe('isOutsideRect', () => {
	it('is false for points inside and on the edges', () => {
		expect(isOutsideRect(RECT, 200, 150)).toBe(false);
		expect(isOutsideRect(RECT, 100, 50)).toBe(false);
		expect(isOutsideRect(RECT, 300, 250)).toBe(false);
	});

	it('is true for a point beyond any edge', () => {
		expect(isOutsideRect(RECT, 99, 150)).toBe(true);
		expect(isOutsideRect(RECT, 301, 150)).toBe(true);
		expect(isOutsideRect(RECT, 200, 49)).toBe(true);
		expect(isOutsideRect(RECT, 200, 251)).toBe(true);
	});
});
