import { describe, expect, it } from 'vitest';

import { formatDateTimeText } from './format-date-time-text';
import { parseDateTimeText } from './parse-date-time-text';

const d = (year: number, month: number, day: number) => ({ year, month, day });
const t = (hour: number, minute: number) => ({ hour, minute });

describe('parseDateTimeText', () => {
	it('ru: дата и время', () => {
		expect(parseDateTimeText('03.11.2026 14:30', 'ru')).toEqual({ date: d(2026, 11, 3), time: t(14, 30) });
		expect(parseDateTimeText('3.11.2026  9:05', 'ru')).toEqual({ date: d(2026, 11, 3), time: t(9, 5) });
		expect(parseDateTimeText('03112026 1430', 'ru')).toEqual({ date: d(2026, 11, 3), time: t(14, 30) });
	});

	it('en-US: порядок месяц/день и период', () => {
		expect(parseDateTimeText('11/03/2026 2:30 PM', 'en-US')).toEqual({ date: d(2026, 11, 3), time: t(14, 30) });
		expect(parseDateTimeText('11/03/2026 12:05 am', 'en-US')).toEqual({ date: d(2026, 11, 3), time: t(0, 5) });
	});

	it('ja: год первым', () => {
		expect(parseDateTimeText('2026/11/03 14:30', 'ja', false)).toEqual({ date: d(2026, 11, 3), time: t(14, 30) });
	});

	it('de: точки и двоеточие', () => {
		expect(parseDateTimeText('03.11.2026 14:30', 'de')).toEqual({ date: d(2026, 11, 3), time: t(14, 30) });
	});

	it('дата без времени допустима', () => {
		expect(parseDateTimeText('03.11.2026', 'ru')).toEqual({ date: d(2026, 11, 3), time: null });
		expect(parseDateTimeText('  03.11.2026  ', 'ru')).toEqual({ date: d(2026, 11, 3), time: null });
	});

	it.each([
		'',
		'   ',
		'14:30',
		'1430',
		'мусор',
		'31.02.2026 10:00',
		'03.11.2026 25:00',
		'03.11.2026 10:5',
		'03.11.26 10:00'
	])('отклоняет %j', (text) => {
		expect(parseDateTimeText(text, 'ru')).toBeNull();
	});

	it('круг с форматом', () => {
		for (const [locale, hour12] of [['ru', undefined], ['en-US', undefined], ['ja', false], ['de', true]] as const) {
			const value = { date: d(2026, 11, 3), time: t(14, 30) };
			const text = formatDateTimeText(value, locale, hour12);
			expect(parseDateTimeText(text, locale, hour12)).toEqual(value);
		}
	});
});
