import { describe, expect, it } from 'vitest';

import { unitPeriod } from './unit-period';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('unitPeriod', () => {
	it('день, месяц и год', () => {
		expect(unitPeriod('days', d(2026, 11, 2))).toEqual({ from: d(2026, 11, 2), to: d(2026, 11, 2) });
		expect(unitPeriod('months', d(2024, 2, 10))).toEqual({ from: d(2024, 2, 1), to: d(2024, 2, 29) });
		expect(unitPeriod('years', d(2026, 11, 2))).toEqual({ from: d(2026, 1, 1), to: d(2026, 12, 31) });
	});
});
