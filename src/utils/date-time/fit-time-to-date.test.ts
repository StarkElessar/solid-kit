import { describe, expect, it } from 'vitest';

import type { DateTimeParts } from './date-time-parts';
import { fitTimeToDate } from './fit-time-to-date';
import { parseIsoDateTime } from './parse-iso-date-time';

function at(text: string): DateTimeParts {
	const parts = parseIsoDateTime(text);
	if (!parts) {
		throw new Error(`Некорректное значение ${text}`);
	}
	return parts;
}

const t = (hour: number, minute: number) => ({ hour, minute });
const date = (day: number) => ({ year: 2026, month: 11, day });

describe('fitTimeToDate', () => {
	it('допустимое время остаётся как есть, даже вне шага', () => {
		expect(fitTimeToDate(date(5), t(9, 7), { step: 15 })).toEqual(t(9, 7));
	});

	it('в день min время раньше границы подтягивается к ней', () => {
		const rules = { min: at('2026-11-03T09:00'), step: 15 };
		expect(fitTimeToDate(date(3), t(7, 20), rules)).toEqual(t(9, 0));
		expect(fitTimeToDate(date(4), t(7, 20), rules)).toEqual(t(7, 20));
	});

	it('в день max время позже границы подтягивается к ней', () => {
		const rules = { max: at('2026-11-10T18:30'), step: 15 };
		expect(fitTimeToDate(date(10), t(23, 0), rules)).toEqual(t(18, 30));
	});

	it('граница вне сетки шага: берётся ближайшая допустимая минута сетки', () => {
		const rules = { min: at('2026-11-03T09:10'), step: 15 };
		expect(fitTimeToDate(date(3), t(8, 0), rules)).toEqual(t(9, 15));
	});

	it('отключённое предикатом время заменяется ближайшим, при равенстве расстояний ранним', () => {
		const rules = { isTimeDisabled: (time: string) => time === '12:00', step: 30 };
		expect(fitTimeToDate(date(5), t(12, 0), rules)).toEqual(t(11, 30));
	});

	it('запрещённая дата и день без допустимого времени дают null', () => {
		expect(fitTimeToDate(date(7), t(9, 0), { isDateDisabled: (value) => value === '2026-11-07', step: 1 })).toBeNull();
		expect(fitTimeToDate(date(5), t(9, 0), { isTimeDisabled: () => true, step: 1 })).toBeNull();
		expect(fitTimeToDate(date(2), t(9, 0), { min: at('2026-11-03T00:00'), step: 1 })).toBeNull();
	});
});
