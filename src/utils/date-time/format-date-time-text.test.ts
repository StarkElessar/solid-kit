import { describe, expect, it } from 'vitest';

import type { DateTimeParts } from './date-time-parts';
import { formatDateTimeText } from './format-date-time-text';

const value: DateTimeParts = { date: { year: 2026, month: 11, day: 3 }, time: { hour: 14, minute: 30 } };

describe('formatDateTimeText', () => {
	it('ru: 24 часа', () => {
		expect(formatDateTimeText(value, 'ru')).toBe('03.11.2026 14:30');
	});

	it('en-US: 12 часов', () => {
		expect(formatDateTimeText(value, 'en-US')).toBe('11/03/2026 2:30 PM');
	});

	it('hour12 перекрывает цикл локали', () => {
		expect(formatDateTimeText(value, 'ru', true)).toBe('03.11.2026 2:30 PM');
		expect(formatDateTimeText(value, 'en-US', false)).toBe('11/03/2026 14:30');
	});

	it('ja: год первым', () => {
		expect(formatDateTimeText(value, 'ja', false)).toBe('2026/11/03 14:30');
	});
});
