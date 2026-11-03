import { describe, expect, it } from 'vitest';

import { compareDates } from './compare-dates';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('compareDates', () => {
	it('сравнивает по году, месяцу и дню', () => {
		expect(compareDates(d(2025, 12, 31), d(2026, 1, 1))).toBeLessThan(0);
		expect(compareDates(d(2026, 2, 28), d(2026, 3, 1))).toBeLessThan(0);
		expect(compareDates(d(2026, 3, 2), d(2026, 3, 1))).toBeGreaterThan(0);
		expect(compareDates(d(2026, 3, 1), d(2026, 3, 1))).toBe(0);
	});
});
