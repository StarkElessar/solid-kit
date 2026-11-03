import { describe, expect, it } from 'vitest';

import { isPeriodReachable } from './is-period-reachable';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('isPeriodReachable', () => {
	it('без границ достижимо', () => {
		expect(isPeriodReachable('days', d(2026, 11, 2), 1)).toBe(true);
		expect(isPeriodReachable('days', d(2026, 11, 2), -1)).toBe(true);
	});

	it('дни: месяц целиком вне границ недостижим', () => {
		const min = d(2026, 11, 1);
		const max = d(2026, 11, 30);
		expect(isPeriodReachable('days', d(2026, 11, 2), -1, min, max)).toBe(false);
		expect(isPeriodReachable('days', d(2026, 11, 2), 1, min, max)).toBe(false);
		expect(isPeriodReachable('days', d(2026, 11, 2), -1, d(2026, 10, 31), max)).toBe(true);
		expect(isPeriodReachable('days', d(2026, 11, 2), 1, min, d(2026, 12, 1))).toBe(true);
	});

	it('месяцы: год целиком вне границ недостижим', () => {
		expect(isPeriodReachable('months', d(2026, 5, 1), 1, undefined, d(2026, 12, 31))).toBe(false);
		expect(isPeriodReachable('months', d(2026, 5, 1), 1, undefined, d(2027, 1, 1))).toBe(true);
		expect(isPeriodReachable('months', d(2026, 5, 1), -1, d(2026, 1, 1))).toBe(false);
	});

	it('годы: десятилетие', () => {
		expect(isPeriodReachable('years', d(2026, 5, 1), 1, undefined, d(2029, 12, 31))).toBe(false);
		expect(isPeriodReachable('years', d(2026, 5, 1), 1, undefined, d(2030, 1, 1))).toBe(true);
		expect(isPeriodReachable('years', d(2026, 5, 1), -1, d(2020, 1, 1))).toBe(false);
		expect(isPeriodReachable('years', d(2026, 5, 1), -1, d(2019, 12, 31))).toBe(true);
	});

	it('у пределов 0001 и 9999', () => {
		expect(isPeriodReachable('days', d(1, 1, 15), -1)).toBe(false);
		expect(isPeriodReachable('days', d(9999, 12, 15), 1)).toBe(false);
		expect(isPeriodReachable('months', d(1, 6, 1), -1)).toBe(false);
		expect(isPeriodReachable('years', d(5, 6, 1), -1)).toBe(false);
		expect(isPeriodReachable('years', d(9995, 6, 1), 1)).toBe(false);
		expect(isPeriodReachable('years', d(9985, 6, 1), 1)).toBe(true);
	});
});
