import { describe, expect, it } from 'vitest';

import { addYears } from './add-years';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('addYears', () => {
	it('29 февраля уходит на 28 февраля в невисокосном году', () => {
		expect(addYears(d(2024, 2, 29), 1)).toEqual(d(2025, 2, 28));
		expect(addYears(d(2024, 2, 29), 4)).toEqual(d(2028, 2, 29));
	});

	it('сдвигает в обе стороны и на десятилетие', () => {
		expect(addYears(d(2026, 11, 2), -1)).toEqual(d(2025, 11, 2));
		expect(addYears(d(2026, 11, 2), 10)).toEqual(d(2036, 11, 2));
	});
});
