import { describe, expect, it } from 'vitest';

import { navigateByKey } from './navigate-by-key';

const d = (year: number, month: number, day: number) => ({ year, month, day });

// 2026-11-18 среда
const WEDNESDAY = d(2026, 11, 18);

describe('navigateByKey: дни', () => {
	it.each([
		['ArrowLeft', false, d(2026, 11, 17), -1],
		['ArrowRight', false, d(2026, 11, 19), 1],
		['ArrowUp', false, d(2026, 11, 11), -1],
		['ArrowDown', false, d(2026, 11, 25), 1],
		['Home', false, d(2026, 11, 16), 1],
		['End', false, d(2026, 11, 22), -1],
		['PageUp', false, d(2026, 10, 18), -1],
		['PageDown', false, d(2026, 12, 18), 1],
		['PageUp', true, d(2025, 11, 18), -1],
		['PageDown', true, d(2027, 11, 18), 1]
	] as const)('%s (shift %s)', (key, shiftKey, target, direction) => {
		expect(navigateByKey('days', key, shiftKey, WEDNESDAY, 1)).toEqual({ target, direction });
	});

	it('Home и End с неделей, начинающейся с воскресенья', () => {
		expect(navigateByKey('days', 'Home', false, WEDNESDAY, 0)?.target).toEqual(d(2026, 11, 15));
		expect(navigateByKey('days', 'End', false, WEDNESDAY, 0)?.target).toEqual(d(2026, 11, 21));
	});

	it('Home в первый день недели остаётся на месте', () => {
		expect(navigateByKey('days', 'Home', false, d(2026, 11, 16), 1)?.target).toEqual(d(2026, 11, 16));
	});

	it('прочие клавиши не навигация', () => {
		expect(navigateByKey('days', 'a', false, WEDNESDAY, 1)).toBeNull();
		expect(navigateByKey('days', 'Enter', false, WEDNESDAY, 1)).toBeNull();
	});
});

describe('navigateByKey: месяцы', () => {
	const date = d(2026, 5, 31);

	it.each([
		['ArrowLeft', d(2026, 4, 30), -1],
		['ArrowRight', d(2026, 6, 30), 1],
		['ArrowUp', d(2026, 2, 28), -1],
		['ArrowDown', d(2026, 8, 31), 1],
		['Home', d(2026, 1, 31), 1],
		['End', d(2026, 12, 31), -1],
		['PageUp', d(2025, 5, 31), -1],
		['PageDown', d(2027, 5, 31), 1]
	] as const)('%s', (key, target, direction) => {
		expect(navigateByKey('months', key, false, date, 1)).toEqual({ target, direction });
	});
});

describe('navigateByKey: годы', () => {
	const date = d(2026, 5, 10);

	it.each([
		['ArrowLeft', d(2025, 5, 10), -1],
		['ArrowRight', d(2027, 5, 10), 1],
		['ArrowUp', d(2023, 5, 10), -1],
		['ArrowDown', d(2029, 5, 10), 1],
		['Home', d(2020, 5, 10), 1],
		['End', d(2029, 5, 10), -1],
		['PageUp', d(2016, 5, 10), -1],
		['PageDown', d(2036, 5, 10), 1]
	] as const)('%s', (key, target, direction) => {
		expect(navigateByKey('years', key, false, date, 1)).toEqual({ target, direction });
	});
});
