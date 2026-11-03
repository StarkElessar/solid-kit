import { describe, expect, it } from 'vitest';

import { DEFAULT_TIME_PICKER_LABELS } from './default-time-picker-labels';
import { timePlaceholder } from './time-placeholder';

describe('timePlaceholder', () => {
	it.each([
		['ru', undefined, 'чч:мм'],
		['de', undefined, 'чч:мм'],
		['fi', undefined, 'чч.мм'],
		['en-US', undefined, 'чч:мм AM/PM'],
		['ru', true, 'чч:мм AM/PM'],
		['en-US', false, 'чч:мм'],
		['ja', true, 'AM/PMчч:мм']
	])('%s hour12=%s → %s', (locale, hour12, expected) => {
		expect(timePlaceholder(locale, hour12, DEFAULT_TIME_PICKER_LABELS)).toBe(expected);
	});

	it('использует подписи из labels', () => {
		expect(timePlaceholder('en-US', undefined, { hourPart: 'HH', minutePart: 'MM', period: 'AM/PM' })).toBe('HH:MM AM/PM');
	});
});
