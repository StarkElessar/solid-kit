import { describe, expect, it } from 'vitest';

import { formatDateText } from './format-date-text';
import { parseDateText } from './parse-date-text';

const NOV_3 = { year: 2026, month: 11, day: 3 };

describe('parseDateText', () => {
	it.each([
		['ru', '03.11.2026'],
		['ru', '3.11.2026'],
		['ru', '03-11-2026'],
		['ru', '03/11/2026'],
		['ru', '03 11 2026'],
		['ru', ' 03.11.2026 '],
		['ru', '03112026'],
		['de', '03.11.2026'],
		['en-US', '11/03/2026'],
		['en-US', '11-3-2026'],
		['en-US', '11032026'],
		['ja', '2026/11/03'],
		['ja', '20261103']
	])('%s: %j', (locale, text) => {
		expect(parseDateText(text, locale)).toEqual(NOV_3);
	});

	it.each([
		['ru', ''],
		['ru', '   '],
		['ru', '03.11.26'],
		['ru', '03.11.202'],
		['ru', '03.11.02026'],
		['ru', '30.02.2026'],
		['ru', '31.04.2026'],
		['ru', '00.11.2026'],
		['ru', '03.13.2026'],
		['ru', '03.00.2026'],
		['ru', '03.11'],
		['ru', '03.11.2026.1'],
		['ru', '03..2026'],
		['ru', '.11.2026'],
		['ru', '3.11.2026 г.'],
		['ru', 'abc'],
		['ru', '0311202'],
		['ru', '031120260'],
		['ru', '123.11.2026'],
		['ru', '03.11.0000'],
		['en-US', '13/03/2026'],
		['ja', '03/11/2026']
	])('не принимает %s: %j', (locale, text) => {
		expect(parseDateText(text, locale)).toBeNull();
	});

	it('день и месяц из одной цифры', () => {
		expect(parseDateText('3.1.2026', 'ru')).toEqual({ year: 2026, month: 1, day: 3 });
		expect(parseDateText('1/3/2026', 'en-US')).toEqual({ year: 2026, month: 1, day: 3 });
	});

	it('29 февраля только в високосный год', () => {
		expect(parseDateText('29.02.2024', 'ru')).toEqual({ year: 2024, month: 2, day: 29 });
		expect(parseDateText('29.02.2026', 'ru')).toBeNull();
	});

	it('обратима с formatDateText', () => {
		for (const locale of ['ru', 'en-US', 'ja', 'de']) {
			const text = formatDateText({ year: 2024, month: 2, day: 29 }, locale);
			expect(parseDateText(text, locale)).toEqual({ year: 2024, month: 2, day: 29 });
		}
	});
});
