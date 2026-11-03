import { describe, expect, it } from 'vitest';

import type { DateTimeParts } from './date-time-parts';
import { timeBoundsForDate } from './time-bounds-for-date';

const min: DateTimeParts = { date: { year: 2026, month: 11, day: 3 }, time: { hour: 9, minute: 0 } };
const max: DateTimeParts = { date: { year: 2026, month: 11, day: 10 }, time: { hour: 18, minute: 30 } };
const day = (value: number) => ({ year: 2026, month: 11, day: value });

describe('timeBoundsForDate', () => {
	it('в день min ограничивает снизу', () => {
		expect(timeBoundsForDate(day(3), min, max)).toEqual({ min: { hour: 9, minute: 0 } });
	});

	it('в день max ограничивает сверху', () => {
		expect(timeBoundsForDate(day(10), min, max)).toEqual({ max: { hour: 18, minute: 30 } });
	});

	it('между границами время не ограничено', () => {
		expect(timeBoundsForDate(day(5), min, max)).toEqual({});
	});

	it('если границы падают на один день, действуют обе', () => {
		const same: DateTimeParts = { date: day(3), time: { hour: 20, minute: 0 } };
		expect(timeBoundsForDate(day(3), min, same)).toEqual({ min: min.time, max: same.time });
	});

	it('без границ пусто', () => {
		expect(timeBoundsForDate(day(3))).toEqual({});
	});
});
