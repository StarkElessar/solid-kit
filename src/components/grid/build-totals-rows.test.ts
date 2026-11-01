import { describe, expect, it } from 'vitest';

import { buildTotalsRows } from './build-totals-rows';
import { DEFAULT_TOTALS_LABELS } from './default-totals-labels';

describe('buildTotalsRows', () => {
	it('без источников строк нет', () => {
		expect(buildTotalsRows(undefined, undefined, DEFAULT_TOTALS_LABELS)).toEqual([]);
	});

	it('только страница: одна строка с подписью страницы', () => {
		expect(buildTotalsRows({ a: 1 }, undefined, DEFAULT_TOTALS_LABELS)).toEqual([
			{ kind: 'page', label: 'Итого на странице', values: { a: 1 } }
		]);
	});

	it('только выборка: одна строка с подписью выборки, из страницы ничего не подставляется', () => {
		expect(buildTotalsRows(undefined, { a: 2 }, DEFAULT_TOTALS_LABELS)).toEqual([
			{ kind: 'all', label: 'Итого по выборке', values: { a: 2 } }
		]);
	});

	it('оба источника: порядок «страница, выборка»', () => {
		const rows = buildTotalsRows({ a: 1 }, { a: 2 }, DEFAULT_TOTALS_LABELS);
		expect(rows.map((row) => row.kind)).toEqual(['page', 'all']);
	});

	it('пустой объект это переданный источник', () => {
		expect(buildTotalsRows({}, undefined, DEFAULT_TOTALS_LABELS)).toHaveLength(1);
	});

	it('подписи берутся из переданных', () => {
		const rows = buildTotalsRows({}, {}, { page: 'Страница', all: 'Все' });
		expect(rows.map((row) => row.label)).toEqual(['Страница', 'Все']);
	});
});
