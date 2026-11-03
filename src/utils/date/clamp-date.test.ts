import { describe, expect, it } from 'vitest';

import { clampDate } from './clamp-date';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('clampDate', () => {
	const min = d(2026, 11, 5);
	const max = d(2026, 11, 20);

	it('оставляет дату внутри диапазона', () => {
		expect(clampDate(d(2026, 11, 10), min, max)).toEqual(d(2026, 11, 10));
	});

	it('зажимает снизу и сверху', () => {
		expect(clampDate(d(2026, 11, 1), min, max)).toBe(min);
		expect(clampDate(d(2026, 12, 1), min, max)).toBe(max);
	});

	it('работает с одной границей и без границ', () => {
		expect(clampDate(d(2026, 1, 1), min)).toBe(min);
		expect(clampDate(d(2027, 1, 1), min)).toEqual(d(2027, 1, 1));
		expect(clampDate(d(2027, 1, 1), undefined, max)).toBe(max);
		expect(clampDate(d(2027, 1, 1))).toEqual(d(2027, 1, 1));
	});
});
