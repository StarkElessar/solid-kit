import { describe, expect, it } from 'vitest';

import { fitChips } from './fit-chips';

describe('fitChips', () => {
	it('все чипы помещаются: счётчик не нужен', () => {
		expect(fitChips([50, 60, 40], 160, 40, 0)).toBe(3);
		expect(fitChips([50, 60, 40], 170, 40, 10)).toBe(3);
	});

	it('граница: сумма ровно равна доступной ширине', () => {
		expect(fitChips([50, 50], 100, 40, 0)).toBe(2);
		expect(fitChips([50, 50], 99, 40, 0)).toBe(1);
	});

	it('не помещается часть: резерв под счётчик вычитается', () => {
		expect(fitChips([50, 50, 50, 50], 150, 40, 0)).toBe(2);
		expect(fitChips([50, 50, 50, 50], 190, 40, 0)).toBe(3);
	});

	it('промежутки между чипами и перед счётчиком учитываются', () => {
		expect(fitChips([50, 50, 50, 50], 150, 40, 10)).toBe(1);
		expect(fitChips([50, 50, 50, 50], 170, 40, 10)).toBe(2);
	});

	it('не помещается ни один: нуль', () => {
		expect(fitChips([200, 50], 100, 40, 4)).toBe(0);
	});

	it('пустой список и нулевые ширины', () => {
		expect(fitChips([], 100, 40, 4)).toBe(0);
		expect(fitChips([0, 0, 0], 0, 0, 0)).toBe(3);
	});
});
