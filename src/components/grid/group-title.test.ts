import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import type { GridGroup } from './grid-group';
import { groupTitle } from './group-title';

const column: GridColumn<unknown> = { id: 'city', title: 'Город', value: () => '' };

function group(value: unknown): GridGroup<unknown> {
	return { key: 'k', field: 'city', value, count: 1, children: { kind: 'not-loaded' } };
}

describe('groupTitle', () => {
	it('«Колонка: значение»', () => {
		expect(groupTitle(column, group('Москва'), '(пусто)')).toBe('Город: Москва');
		expect(groupTitle(column, group(0), '(пусто)')).toBe('Город: 0');
	});

	it('пустое значение заменяется текстом', () => {
		expect(groupTitle(column, group(null), '(пусто)')).toBe('Город: (пусто)');
		expect(groupTitle(column, group(''), '(пусто)')).toBe('Город: (пусто)');
	});

	it('без колонки берётся field', () => {
		expect(groupTitle(undefined, group('x'), '(пусто)')).toBe('city: x');
	});
});
