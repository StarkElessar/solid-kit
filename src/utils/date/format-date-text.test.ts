import { describe, expect, it } from 'vitest';

import { formatDateText } from './format-date-text';

describe('formatDateText', () => {
	it.each([
		['ru', '03.11.2026'],
		['de', '03.11.2026'],
		['en-GB', '03/11/2026'],
		['en-US', '11/03/2026'],
		['ja', '2026/11/03']
	])('%s', (locale, expected) => {
		expect(formatDateText({ year: 2026, month: 11, day: 3 }, locale)).toBe(expected);
	});

	it('дополняет нулями день, месяц и год', () => {
		expect(formatDateText({ year: 99, month: 1, day: 5 }, 'ru')).toBe('05.01.0099');
	});
});
