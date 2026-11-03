import { describe, expect, it } from 'vitest';

import { weekdayOf } from './weekday-of';

describe('weekdayOf', () => {
	it.each([
		[{ year: 2026, month: 11, day: 2 }, 1],
		[{ year: 2026, month: 11, day: 1 }, 0],
		[{ year: 2000, month: 1, day: 1 }, 6],
		[{ year: 2024, month: 2, day: 29 }, 4]
	])('%j: %i', (parts, expected) => {
		expect(weekdayOf(parts)).toBe(expected);
	});
});
