import { describe, expect, it } from 'vitest';

import { formatTimeText } from './format-time-text';
import { parseTimeText } from './parse-time-text';

const at = (hour: number, minute: number) => ({ hour, minute });

describe('parseTimeText, 24 часа', () => {
	it.each([
		['ru', '14:30', 14, 30],
		['ru', '9:30', 9, 30],
		['ru', '09:30', 9, 30],
		['ru', '9.30', 9, 30],
		['ru', '9 30', 9, 30],
		['ru', '9-30', 9, 30],
		['ru', ' 14:30 ', 14, 30],
		['ru', '930', 9, 30],
		['ru', '0930', 9, 30],
		['ru', '1430', 14, 30],
		['ru', '9', 9, 0],
		['ru', '9:', 9, 0],
		['ru', '14:', 14, 0],
		['ru', '09. ', 9, 0],
		['ru', '09', 9, 0],
		['ru', '14', 14, 0],
		['ru', '0', 0, 0],
		['ru', '23:59', 23, 59],
		['ru', '00:00', 0, 0],
		['ja', '14:30', 14, 30],
		['fi', '14.30', 14, 30]
	])('%s: %j', (locale, text, hour, minute) => {
		expect(parseTimeText(text, locale)).toEqual(at(hour, minute));
	});

	it.each([
		'', '   ', '9:5', ':30', '25:00', '24:00', '12:60', '99', '12345', '9:300', '9:30:15', 'abc', '14:30 pm', '9am', '1.2.3'
	])('ru: %j не разбирается', (text) => {
		expect(parseTimeText(text, 'ru')).toBeNull();
	});
});

describe('parseTimeText, 12 часов', () => {
	it.each([
		['2:30 PM', 14, 30],
		['2:30pm', 14, 30],
		['2:30 p.m.', 14, 30],
		['2:30 P.M.', 14, 30],
		['2:30 Pm', 14, 30],
		['230pm', 14, 30],
		['2pm', 14, 0],
		['12 AM', 0, 0],
		['12:30 AM', 0, 30],
		['12 PM', 12, 0],
		['12:30 PM', 12, 30],
		['11:59 pm', 23, 59],
		['1:00 am', 1, 0],
		['2:30', 2, 30],
		['9', 9, 0],
		['11:15', 11, 15],
		['12:30', 12, 30],
		['12', 12, 0],
		['0:15', 0, 15],
		['14:30', 14, 30],
		['23:00', 23, 0]
	])('en-US: %j', (text, hour, minute) => {
		expect(parseTimeText(text, 'en-US')).toEqual(at(hour, minute));
	});

	it.each(['0 PM', '13 PM', '13:00 AM', '2:60 PM', '2:5 PM', 'PM', 'pm 2:30 am', '24:00'])('en-US: %j не разбирается', (text) => {
		expect(parseTimeText(text, 'en-US')).toBeNull();
	});

	it('ru с hour12 понимает суффикс', () => {
		expect(parseTimeText('2:30 PM', 'ru', true)).toEqual(at(14, 30));
	});

	it('en-US с hour12 false не принимает суффикс', () => {
		expect(parseTimeText('2:30 PM', 'en-US', false)).toBeNull();
		expect(parseTimeText('14:30', 'en-US', false)).toEqual(at(14, 30));
	});

	it('ja: период перед временем', () => {
		expect(parseTimeText('午後2:30', 'ja', true)).toEqual(at(14, 30));
		expect(parseTimeText('午前12:05', 'ja', true)).toEqual(at(0, 5));
	});
});

describe('parseTimeText: обратимость с formatTimeText', () => {
	const cases: ReadonlyArray<readonly [string, boolean | undefined]> = [
		['ru', undefined], ['en-US', undefined], ['ru', true], ['en-US', false], ['ja', true], ['fi', undefined]
	];
	it.each(cases)('%s hour12=%s: все минуты суток', (locale, hour12) => {
		for (let hour = 0; hour < 24; hour += 1) {
			for (const minute of [0, 5, 30, 59]) {
				const time = at(hour, minute);
				expect(parseTimeText(formatTimeText(time, locale, hour12), locale, hour12)).toEqual(time);
			}
		}
	});
});
