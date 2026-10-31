import { describe, expect, it } from 'vitest';

import { layoutCssVars, leftVar, TABLE_WIDTH_VAR, widthVar } from './column-css-vars';
import { computeColumnLayout } from './column-layout';
import type { GridColumn } from './grid-column';

interface Row {
	id: number;
}

function column(id: string, extra: Partial<GridColumn<Row>> = {}): GridColumn<Row> {
	return { id, title: id, value: (row) => row.id, ...extra };
}

describe('имена переменных', () => {
	it('строятся по индексу', () => {
		expect(TABLE_WIDTH_VAR).toBe('--s-kit-grid-table-w');
		expect(widthVar(3)).toBe('--s-kit-grid-w-3');
		expect(leftVar(3)).toBe('--s-kit-grid-left-3');
	});
});

describe('layoutCssVars', () => {
	it('ширины всех колонок, сумма и left только у закреплённых', () => {
		const layout = computeColumnLayout(
			[column('a', { locked: true, width: 100 }), column('b', { width: 120 }), column('c', { width: 80 })],
			{},
			{ selectable: true, selectWidth: 44 }
		);
		expect(layoutCssVars(layout)).toEqual({
			'--s-kit-grid-table-w': '344px',
			'--s-kit-grid-w-0': '100px',
			'--s-kit-grid-w-1': '120px',
			'--s-kit-grid-w-2': '80px',
			'--s-kit-grid-left-0': '44px'
		});
	});

	it('пустая раскладка даёт только нулевую сумму', () => {
		const layout = computeColumnLayout([], {}, { selectable: false, selectWidth: 44 });
		expect(layoutCssVars(layout)).toEqual({ '--s-kit-grid-table-w': '0px' });
	});
});
