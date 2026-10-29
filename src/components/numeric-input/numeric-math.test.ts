import { describe, expect, it } from 'vitest';

import { clamp, countDecimals, formatNumeric, parseNumericText, roundTo, sanitizeNumericText } from './numeric-math';

function options(precision: number, allowNegative = true): { precision: number; allowNegative: boolean } {
	return { precision, allowNegative };
}

describe('countDecimals', () => {
	it('counts the digits after the point', () => {
		expect(countDecimals(1)).toBe(0);
		expect(countDecimals(10)).toBe(0);
		expect(countDecimals(0.25)).toBe(2);
		expect(countDecimals(-1.5)).toBe(1);
	});
});

describe('roundTo', () => {
	it('removes float noise and the negative zero', () => {
		expect(roundTo(0.1 + 0.2, 1)).toBe(0.3);
		expect(roundTo(1.26, 1)).toBe(1.3);
		expect(roundTo(7, 0)).toBe(7);
		expect(Object.is(roundTo(-0.0001, 2), 0)).toBe(true);
	});
});

describe('clamp', () => {
	it('limits the value by the bounds that are set', () => {
		expect(clamp(5, 0, 3)).toBe(3);
		expect(clamp(-1, 0, 3)).toBe(0);
		expect(clamp(2, undefined, undefined)).toBe(2);
		expect(clamp(5, undefined, 3)).toBe(3);
		expect(clamp(-5, 0, undefined)).toBe(0);
	});
});

describe('sanitizeNumericText', () => {
	it('turns a comma into the separator and keeps only the first one', () => {
		expect(sanitizeNumericText('1,5', options(2))).toBe('1.5');
		expect(sanitizeNumericText('1.2.3', options(2))).toBe('1.23');
	});

	it('cuts the fraction to the precision and drops the separator at precision 0', () => {
		expect(sanitizeNumericText('1.999', options(2))).toBe('1.99');
		expect(sanitizeNumericText('1.5', options(0))).toBe('1');
		expect(sanitizeNumericText('1.', options(2))).toBe('1.');
	});

	it('allows the sign only first and only when negatives are allowed', () => {
		expect(sanitizeNumericText('-5', options(0))).toBe('-5');
		expect(sanitizeNumericText('5-', options(0))).toBe('5');
		expect(sanitizeNumericText('-5', options(0, false))).toBe('5');
		expect(sanitizeNumericText('-', options(0))).toBe('-');
	});

	it('removes everything but digits', () => {
		expect(sanitizeNumericText('a1b2c', options(0))).toBe('12');
		expect(sanitizeNumericText('', options(0))).toBe('');
		expect(sanitizeNumericText(' 7 ', options(0))).toBe('7');
	});
});

describe('parseNumericText', () => {
	it('returns null without digits and parses the partial forms', () => {
		expect(parseNumericText('')).toBeNull();
		expect(parseNumericText('-')).toBeNull();
		expect(parseNumericText('.')).toBeNull();
		expect(parseNumericText('-.')).toBeNull();
		expect(parseNumericText('12')).toBe(12);
		expect(parseNumericText('1.')).toBe(1);
		expect(parseNumericText('.5')).toBe(0.5);
		expect(parseNumericText('-0.5')).toBe(-0.5);
	});
});

describe('formatNumeric', () => {
	it('writes null as an empty text and a number as its decimal record', () => {
		expect(formatNumeric(null)).toBe('');
		expect(formatNumeric(0)).toBe('0');
		expect(formatNumeric(12.5)).toBe('12.5');
		expect(formatNumeric(-3)).toBe('-3');
	});
});
