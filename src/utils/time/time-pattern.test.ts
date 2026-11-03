import { describe, expect, it } from 'vitest';

import { timePattern } from './time-pattern';

describe('timePattern', () => {
	it.each([
		['ru', false],
		['de', false],
		['ja', false],
		['en-GB', false],
		['en-US', true],
		['en', true]
	])('%s: двенадцатичасовой вид %s по локали', (locale, expected) => {
		expect(timePattern(locale).hour12).toBe(expected);
	});

	it('разделитель берётся из локали', () => {
		expect(timePattern('ru').separator).toBe(':');
		expect(timePattern('fi').separator).toBe('.');
	});

	it('hour12 перекрывает цикл локали в обе стороны', () => {
		expect(timePattern('ru', true).hour12).toBe(true);
		expect(timePattern('en-US', false).hour12).toBe(false);
	});

	it('названия периода и зазор для en-US', () => {
		expect(timePattern('en-US')).toMatchObject({ am: 'AM', pm: 'PM', periodFirst: false, periodGap: ' ' });
	});

	it('для ja в 12-часовом виде период стоит перед временем без зазора', () => {
		expect(timePattern('ja', true)).toMatchObject({ am: '午前', pm: '午後', periodFirst: true, periodGap: '' });
	});

	it('недопустимая локаль даёт запасной образец без исключения', () => {
		expect(timePattern('!!')).toEqual({ hour12: false, separator: ':', periodFirst: false, periodGap: ' ', am: 'AM', pm: 'PM' });
		expect(timePattern('!!', true).hour12).toBe(true);
	});

	it('результат кэшируется по паре локаль и hour12', () => {
		expect(timePattern('ru')).toBe(timePattern('ru'));
		expect(timePattern('ru', true)).toBe(timePattern('ru', true));
		expect(timePattern('ru', true)).not.toBe(timePattern('ru'));
	});
});
