import { describe, expect, it } from 'vitest';

import { datePattern } from './date-pattern';

describe('datePattern', () => {
	it.each([
		['ru', ['day', 'month', 'year'], '.'],
		['de', ['day', 'month', 'year'], '.'],
		['en-GB', ['day', 'month', 'year'], '/'],
		['en-US', ['month', 'day', 'year'], '/'],
		['ja', ['year', 'month', 'day'], '/'],
		['ko', ['year', 'month', 'day'], '.']
	])('%s', (locale, order, separator) => {
		expect(datePattern(locale)).toEqual({ order, separator });
	});

	it('недопустимая локаль даёт день-месяц-год с точкой', () => {
		expect(datePattern('!!')).toEqual({ order: ['day', 'month', 'year'], separator: '.' });
	});

	it('результат кэшируется', () => {
		expect(datePattern('ru')).toBe(datePattern('ru'));
	});
});
