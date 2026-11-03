import { describe, expect, it } from 'vitest';

import { shiftFocused } from './shift-focused';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('shiftFocused', () => {
	it('дни: месяц, день ужимается', () => {
		expect(shiftFocused('days', d(2026, 1, 31), 1)).toEqual(d(2026, 2, 28));
		expect(shiftFocused('days', d(2026, 1, 15), -1)).toEqual(d(2025, 12, 15));
	});

	it('месяцы: год', () => {
		expect(shiftFocused('months', d(2024, 2, 29), 1)).toEqual(d(2025, 2, 28));
		expect(shiftFocused('months', d(2026, 5, 10), -1)).toEqual(d(2025, 5, 10));
	});

	it('годы: десять лет', () => {
		expect(shiftFocused('years', d(2026, 5, 10), 1)).toEqual(d(2036, 5, 10));
		expect(shiftFocused('years', d(2026, 5, 10), -1)).toEqual(d(2016, 5, 10));
	});
});
