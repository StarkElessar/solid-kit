import { describe, expect, it } from 'vitest';

import { datePlaceholder } from './date-placeholder';
import { DEFAULT_DATE_PICKER_LABELS } from './default-date-picker-labels';

describe('datePlaceholder', () => {
	it.each([
		['ru', 'дд.мм.гггг'],
		['en-US', 'мм/дд/гггг'],
		['ja', 'гггг/мм/дд']
	])('%s', (locale, expected) => {
		expect(datePlaceholder(locale, DEFAULT_DATE_PICKER_LABELS)).toBe(expected);
	});

	it('использует подписи из labels', () => {
		expect(datePlaceholder('en-US', { day: 'DD', month: 'MM', year: 'YYYY' })).toBe('MM/DD/YYYY');
	});
});
