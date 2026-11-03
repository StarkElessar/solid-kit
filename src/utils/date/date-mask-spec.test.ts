import { describe, expect, it } from 'vitest';

import { dateMaskSpec } from './date-mask-spec';

describe('dateMaskSpec', () => {
	it('ru: день, месяц, год через точку', () => {
		const spec = dateMaskSpec('ru');
		expect(spec.fields.map((field) => field.width)).toEqual([2, 2, 4]);
		expect(spec.separators).toEqual(['.', '.']);
		expect(spec.suffixLetters).toBe('');
	});

	it('en-US: месяц первым, разделитель слэш', () => {
		const spec = dateMaskSpec('en-US');
		expect(spec.fields.map((field) => field.maxFirstDigit)).toEqual([1, 3, undefined]);
		expect(spec.separators).toEqual(['/', '/']);
	});

	it('ja: год первым', () => {
		expect(dateMaskSpec('ja').fields.map((field) => field.width)).toEqual([4, 2, 2]);
	});
});
