import { describe, expect, it } from 'vitest';

import { compareDateTimes } from './compare-date-times';
import type { DateTimeParts } from './date-time-parts';

const at = (day: number, hour: number, minute: number): DateTimeParts => ({
	date: { year: 2026, month: 11, day },
	time: { hour, minute }
});

describe('compareDateTimes', () => {
	it('сначала сравнивает дату', () => {
		expect(compareDateTimes(at(2, 23, 59), at(3, 0, 0))).toBeLessThan(0);
		expect(compareDateTimes(at(4, 0, 0), at(3, 23, 59))).toBeGreaterThan(0);
	});

	it('при равной дате сравнивает время', () => {
		expect(compareDateTimes(at(3, 9, 0), at(3, 9, 1))).toBeLessThan(0);
		expect(compareDateTimes(at(3, 10, 0), at(3, 9, 59))).toBeGreaterThan(0);
	});

	it('равные моменты дают ноль', () => {
		expect(compareDateTimes(at(3, 9, 30), at(3, 9, 30))).toBe(0);
	});
});
