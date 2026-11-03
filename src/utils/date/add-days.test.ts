import { describe, expect, it } from 'vitest';

import { addDays } from './add-days';
import { MAX_DATE, MIN_DATE } from './date-limits';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('addDays', () => {
	it('идёт через границы месяца и года', () => {
		expect(addDays(d(2026, 10, 31), 1)).toEqual(d(2026, 11, 1));
		expect(addDays(d(2026, 12, 31), 1)).toEqual(d(2027, 1, 1));
		expect(addDays(d(2026, 1, 1), -1)).toEqual(d(2025, 12, 31));
		expect(addDays(d(2026, 3, 1), -1)).toEqual(d(2026, 2, 28));
		expect(addDays(d(2024, 3, 1), -1)).toEqual(d(2024, 2, 29));
	});

	it('год: 365 и 366 суток', () => {
		expect(addDays(d(2025, 1, 1), 365)).toEqual(d(2026, 1, 1));
		expect(addDays(d(2024, 1, 1), 366)).toEqual(d(2025, 1, 1));
	});

	it('переходы на летнее время не теряют и не дублируют сутки', () => {
		expect(addDays(d(2026, 3, 28), 1)).toEqual(d(2026, 3, 29));
		expect(addDays(d(2026, 3, 29), 1)).toEqual(d(2026, 3, 30));
		expect(addDays(d(2026, 10, 24), 1)).toEqual(d(2026, 10, 25));
		expect(addDays(d(2026, 10, 25), 1)).toEqual(d(2026, 10, 26));
		expect(addDays(d(2026, 3, 1), 60)).toEqual(d(2026, 4, 30));
	});

	it('не выходит за 0001-01-01…9999-12-31', () => {
		expect(addDays(MIN_DATE, -1)).toEqual(MIN_DATE);
		expect(addDays(MAX_DATE, 1)).toEqual(MAX_DATE);
	});
});
