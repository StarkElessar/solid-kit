import { describe, expect, it } from 'vitest';

import { computeColumnLayout } from './column-layout';
import type { GridColumn } from './grid-column';

interface Row {
	id: number;
}

function column(id: string, extra: Partial<GridColumn<Row>> = {}): GridColumn<Row> {
	return { id, title: id, value: (row) => row.id, ...extra };
}

const none = { selectable: false, selectWidth: 44 };

describe('computeColumnLayout', () => {
	it('пустой список колонок даёт нули', () => {
		const layout = computeColumnLayout([], {}, none);
		expect(layout).toEqual({ columns: [], selectWidth: 0, tableWidth: 0, stickyWidth: 0 });
	});

	it('скрытые колонки пропускаются, индексы сквозные среди видимых', () => {
		const layout = computeColumnLayout([column('a'), column('b', { hidden: true }), column('c')], {}, none);
		expect(layout.columns.map((item) => [item.column.id, item.index])).toEqual([['a', 0], ['c', 1]]);
	});

	it('закреплённые идут первыми, внутри групп порядок массива, индексы пересчитаны после перестановки', () => {
		const layout = computeColumnLayout(
			[column('a'), column('b', { locked: true }), column('c'), column('d', { locked: true })],
			{},
			none
		);
		expect(layout.columns.map((item) => [item.column.id, item.index, item.sticky])).toEqual([
			['b', 0, true], ['d', 1, true], ['a', 2, false], ['c', 3, false]
		]);
	});

	it('ширина: словарь важнее width, width важнее 160, результат не меньше minWidth (по умолчанию 60)', () => {
		const layout = computeColumnLayout(
			[
				column('a'),
				column('b', { width: 200 }),
				column('c', { width: 200 }),
				column('d', { width: 40 }),
				column('e', { minWidth: 100, width: 80 })
			],
			{ c: 300 },
			none
		);
		expect(layout.columns.map((item) => item.width)).toEqual([160, 200, 300, 60, 100]);
	});

	it('ширина из словаря и width не превышают maxWidth колонки', () => {
		const layout = computeColumnLayout([column('a', { maxWidth: 200 }), column('b', { width: 300, maxWidth: 200 })], { a: 500 }, none);
		expect(layout.columns.map((item) => item.width)).toEqual([200, 200]);
	});

	it('ширина из словаря не опускается ниже minWidth колонки', () => {
		const layout = computeColumnLayout([column('a', { minWidth: 90 })], { a: 20 }, none);
		expect(layout.columns[0]?.width).toBe(90);
	});

	it('left sticky-колонок накапливается, у обычных нулевой', () => {
		const layout = computeColumnLayout(
			[column('a', { locked: true, width: 100 }), column('b', { locked: true, width: 120 }), column('c')],
			{},
			none
		);
		expect(layout.columns.map((item) => item.left)).toEqual([0, 100, 0]);
		expect(layout.stickyWidth).toBe(220);
	});

	it('колонка чекбоксов занимает начало: left первой sticky равен selectWidth, tableWidth и stickyWidth её включают', () => {
		const layout = computeColumnLayout(
			[column('a', { locked: true, width: 100 }), column('b', { width: 120 })],
			{},
			{ selectable: true, selectWidth: 44 }
		);
		expect(layout.selectWidth).toBe(44);
		expect(layout.columns.map((item) => item.left)).toEqual([44, 0]);
		expect(layout.tableWidth).toBe(44 + 100 + 120);
		expect(layout.stickyWidth).toBe(44 + 100);
	});

	it('без selectable selectWidth равен нулю, даже если ширина передана', () => {
		const layout = computeColumnLayout([column('a', { width: 100 })], {}, { selectable: false, selectWidth: 44 });
		expect(layout.selectWidth).toBe(0);
		expect(layout.tableWidth).toBe(100);
	});

	it('не мутирует входные колонки и словарь', () => {
		const columns = [column('a', { locked: true }), column('b')];
		const widths = { a: 200 };
		computeColumnLayout(columns, widths, none);
		expect(columns.map((item) => item.id)).toEqual(['a', 'b']);
		expect(widths).toEqual({ a: 200 });
	});
});
