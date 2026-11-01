import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import { visibleColumnIds } from './visible-column-ids';

function column(id: string): GridColumn<unknown> {
	return { id, title: id, value: () => null };
}

describe('visibleColumnIds', () => {
	const columns = [column('a'), column('b'), column('c')];

	it('возвращает id в порядке columns без скрытых', () => {
		expect(visibleColumnIds(columns, new Set(['b']))).toEqual(['a', 'c']);
	});

	it('без скрытых возвращает все', () => {
		expect(visibleColumnIds(columns, new Set())).toEqual(['a', 'b', 'c']);
	});

	it('неизвестный id в наборе игнорируется', () => {
		expect(visibleColumnIds(columns, new Set(['zzz']))).toEqual(['a', 'b', 'c']);
	});

	it('все скрыты: пустой список', () => {
		expect(visibleColumnIds(columns, new Set(['a', 'b', 'c']))).toEqual([]);
	});
});
