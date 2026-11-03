import { describe, expect, it } from 'vitest';

import { periodOverlapsLimits } from './period-overlaps-limits';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('periodOverlapsLimits', () => {
	const from = d(2026, 11, 1);
	const to = d(2026, 11, 30);

	it('без границ пересекается', () => {
		expect(periodOverlapsLimits(from, to)).toBe(true);
	});

	it('касание границы засчитывается', () => {
		expect(periodOverlapsLimits(from, to, d(2026, 11, 30))).toBe(true);
		expect(periodOverlapsLimits(from, to, undefined, d(2026, 11, 1))).toBe(true);
	});

	it('период целиком вне границ не пересекается', () => {
		expect(periodOverlapsLimits(from, to, d(2026, 12, 1))).toBe(false);
		expect(periodOverlapsLimits(from, to, undefined, d(2026, 10, 31))).toBe(false);
	});

	it('пределы 0001 и 9999', () => {
		expect(periodOverlapsLimits(d(0, 1, 1), d(0, 12, 31))).toBe(false);
		expect(periodOverlapsLimits(d(0, 6, 1), d(1, 6, 1))).toBe(true);
		expect(periodOverlapsLimits(d(10_000, 1, 1), d(10_000, 12, 31))).toBe(false);
	});
});
