import { describe, expect, it } from 'vitest';

import { formatCellValue } from './format-cell-value';

describe('formatCellValue', () => {
	it('null и undefined дают пустую строку', () => {
		expect(formatCellValue(null)).toBe('');
		expect(formatCellValue(undefined)).toBe('');
	});

	it('строка остаётся как есть', () => {
		expect(formatCellValue('Иван')).toBe('Иван');
		expect(formatCellValue('')).toBe('');
	});

	it('0 и false не превращаются в пустую строку', () => {
		expect(formatCellValue(0)).toBe('0');
		expect(formatCellValue(false)).toBe('false');
		expect(formatCellValue(true)).toBe('true');
	});

	it('числа и bigint приводятся к строке', () => {
		expect(formatCellValue(42.5)).toBe('42.5');
		expect(formatCellValue(NaN)).toBe('NaN');
		expect(formatCellValue(10n)).toBe('10');
	});

	it('Date даёт ISO-строку', () => {
		expect(formatCellValue(new Date('2026-10-31T12:00:00.000Z'))).toBe('2026-10-31T12:00:00.000Z');
	});

	it('невалидная Date даёт пустую строку', () => {
		expect(formatCellValue(new Date('нет'))).toBe('');
	});

	it('объекты, массивы, функции и символы дают пустую строку', () => {
		expect(formatCellValue({ a: 1 })).toBe('');
		expect(formatCellValue([1, 2])).toBe('');
		expect(formatCellValue(() => 1)).toBe('');
		expect(formatCellValue(Symbol('x'))).toBe('');
	});
});
