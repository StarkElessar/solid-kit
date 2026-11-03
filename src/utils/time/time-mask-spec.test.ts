import { describe, expect, it } from 'vitest';

import { timeMaskSpec } from './time-mask-spec';

describe('timeMaskSpec', () => {
	it('ru: 24 часа с нулём в часах и без суффикса', () => {
		const spec = timeMaskSpec('ru');
		expect(spec?.fields).toEqual([{ width: 2, pad: true, maxFirstDigit: 2 }, { width: 2, pad: false }]);
		expect(spec?.separators).toEqual([':']);
		expect(spec?.suffixLetters).toBe('');
	});

	it('en-US: 12 часов без нуля и с буквами периода', () => {
		const spec = timeMaskSpec('en-US');
		expect(spec?.fields[0]).toEqual({ width: 2, pad: false, maxFirstDigit: 1 });
		expect(spec?.suffixLetters).toContain('a');
		expect(spec?.suffixLetters).toContain('p');
		expect(spec?.suffixLetters).toContain('m');
		expect(spec?.suffixLetters).not.toContain('.');
	});

	it('hour12 перекрывает цикл локали', () => {
		expect(timeMaskSpec('ru', true)?.suffixLetters).not.toBe('');
		expect(timeMaskSpec('en-US', false)?.suffixLetters).toBe('');
	});

	it('12 часов с периодом перед временем: маски нет', () => {
		expect(timeMaskSpec('ko', true)).toBeNull();
	});
});
