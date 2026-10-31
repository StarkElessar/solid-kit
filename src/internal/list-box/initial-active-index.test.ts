import { describe, expect, it } from 'vitest';

import { initialActiveIndex } from './initial-active-index';
import { buildRows } from './rows.test-helper';

// индексы: 0 #G, 1 !A, 2 B, 3 C, 4 =Все
const rows = buildRows(['#G', '!A', 'B', 'C', '=Все']);

describe('initialActiveIndex', () => {
	it('индекс первой выбранной доступной опции', () => {
		expect(initialActiveIndex(rows, ['C'])).toBe(3);
		expect(initialActiveIndex(rows, ['C', 'B'])).toBe(2);
	});

	it('без выбранного (или выбранное отсутствует) первая доступная', () => {
		expect(initialActiveIndex(rows, [])).toBe(2);
		expect(initialActiveIndex(rows, ['нет'])).toBe(2);
	});

	it('выбранная отключённая опция пропускается', () => {
		expect(initialActiveIndex(rows, ['A'])).toBe(2);
	});

	it('строка «Все» подсвечивается, если её ключ выбран', () => {
		expect(initialActiveIndex(rows, ['Все'])).toBe(4);
	});

	it('нет доступных строк: -1', () => {
		expect(initialActiveIndex(buildRows(['#G', '!A']), ['A'])).toBe(-1);
		expect(initialActiveIndex([], [])).toBe(-1);
	});
});
