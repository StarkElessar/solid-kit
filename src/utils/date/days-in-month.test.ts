import { describe, expect, it } from 'vitest';

import { daysInMonth } from './days-in-month';

describe('daysInMonth', () => {
	it.each([
		[1, 31], [2, 28], [3, 31], [4, 30], [5, 31], [6, 30],
		[7, 31], [8, 31], [9, 30], [10, 31], [11, 30], [12, 31]
	])('месяц %i обычного года: %i', (month, expected) => {
		expect(daysInMonth(2026, month)).toBe(expected);
	});

	it.each([
		[2024, 29],
		[1900, 28],
		[2000, 29],
		[2100, 28],
		[4, 29]
	])('февраль %i: %i', (year, expected) => {
		expect(daysInMonth(year, 2)).toBe(expected);
	});
});
