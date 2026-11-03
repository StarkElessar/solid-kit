import { describe, expect, it } from 'vitest';

import { dateTimeMaskSpec } from './date-time-mask-spec';

describe('dateTimeMaskSpec', () => {
	it('ru: пять частей и пробел между датой и временем', () => {
		const spec = dateTimeMaskSpec('ru');
		expect(spec?.fields.map((field) => field.width)).toEqual([2, 2, 4, 2, 2]);
		expect(spec?.separators).toEqual(['.', '.', ' ', ':']);
		expect(spec?.suffixLetters).toBe('');
	});

	it('en-US: 12 часов с буквами периода', () => {
		const spec = dateTimeMaskSpec('en-US');
		expect(spec?.separators).toEqual(['/', '/', ' ', ':']);
		expect(spec?.suffixLetters).toContain('p');
	});

	it('12 часов с периодом перед временем: маски нет', () => {
		expect(dateTimeMaskSpec('ko', true)).toBeNull();
	});
});
