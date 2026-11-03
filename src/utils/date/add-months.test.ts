import { describe, expect, it } from 'vitest';

import { addMonths } from './add-months';
import { MAX_DATE, MIN_DATE } from './date-limits';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('addMonths', () => {
	it('ужимает день до длины месяца', () => {
		expect(addMonths(d(2026, 1, 31), 1)).toEqual(d(2026, 2, 28));
		expect(addMonths(d(2024, 1, 31), 1)).toEqual(d(2024, 2, 29));
		expect(addMonths(d(2026, 5, 31), 1)).toEqual(d(2026, 6, 30));
	});

	it('идёт через границу года в обе стороны', () => {
		expect(addMonths(d(2026, 12, 15), 1)).toEqual(d(2027, 1, 15));
		expect(addMonths(d(2026, 1, 15), -1)).toEqual(d(2025, 12, 15));
		expect(addMonths(d(2026, 1, 15), -13)).toEqual(d(2024, 12, 15));
		expect(addMonths(d(2026, 11, 2), 12)).toEqual(d(2027, 11, 2));
		expect(addMonths(d(2026, 11, 2), 0)).toEqual(d(2026, 11, 2));
	});

	it('не выходит за 0001-01-01…9999-12-31', () => {
		expect(addMonths(d(1, 1, 15), -1)).toEqual(MIN_DATE);
		expect(addMonths(d(9999, 12, 15), 1)).toEqual(MAX_DATE);
	});
});
