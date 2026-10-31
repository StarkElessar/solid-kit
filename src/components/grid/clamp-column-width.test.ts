import { describe, expect, it } from 'vitest';

import { clampColumnWidth, DEFAULT_COLUMN_WIDTH, DEFAULT_MIN_COLUMN_WIDTH } from './clamp-column-width';

describe('clampColumnWidth', () => {
	it('константы по умолчанию', () => {
		expect(DEFAULT_COLUMN_WIDTH).toBe(160);
		expect(DEFAULT_MIN_COLUMN_WIDTH).toBe(60);
	});

	it('меньше минимума даёт минимум', () => {
		expect(clampColumnWidth(20)).toBe(60);
		expect(clampColumnWidth(-5)).toBe(60);
	});

	it('ровно минимум и больше остаются как есть', () => {
		expect(clampColumnWidth(60)).toBe(60);
		expect(clampColumnWidth(240)).toBe(240);
	});

	it('дробные значения округляются до целых px, но не уходят ниже минимума', () => {
		expect(clampColumnWidth(120.4)).toBe(120);
		expect(clampColumnWidth(120.6)).toBe(121);
		expect(clampColumnWidth(59.6)).toBe(60);
	});

	it('нечисло даёт минимум', () => {
		expect(clampColumnWidth(Number.NaN)).toBe(60);
		expect(clampColumnWidth(Number.POSITIVE_INFINITY)).toBe(60);
	});

	it('учитывает свой минимум', () => {
		expect(clampColumnWidth(80, 100)).toBe(100);
		expect(clampColumnWidth(150, 100)).toBe(150);
	});
});
