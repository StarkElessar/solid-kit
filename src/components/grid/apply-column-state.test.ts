import { describe, expect, it } from 'vitest';

import { applyColumnState } from './apply-column-state';
import type { GridColumn } from './grid-column';

function column(id: string, extra: Partial<GridColumn<unknown>> = {}): GridColumn<unknown> {
	return { id, title: id, value: () => null, ...extra };
}

describe('applyColumnState', () => {
	it('выставляет hidden и locked по наборам, остальные поля и порядок сохраняет', () => {
		const source = [column('a', { width: 100 }), column('b'), column('c')];
		const result = applyColumnState(source, new Set(['b']), new Set(['c']));
		expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c']);
		expect(result[0]?.width).toBe(100);
		expect(result[1]?.hidden).toBe(true);
		expect(result[2]?.locked).toBe(true);
	});

	it('колонку без изменений возвращает тем же объектом', () => {
		const first = column('a');
		const second = column('b', { hidden: true });
		const result = applyColumnState([first, second], new Set(['b']), new Set());
		expect(result[0]).toBe(first);
		expect(result[1]).toBe(second);
	});

	it('наборы перекрывают поля колонок в обе стороны', () => {
		const source = [column('a', { hidden: true, locked: true })];
		const [item] = applyColumnState(source, new Set(), new Set());
		expect(item?.hidden).toBe(false);
		expect(item?.locked).toBe(false);
	});

	it('не мутирует исходные колонки и массив', () => {
		const first = column('a');
		const source = [first];
		applyColumnState(source, new Set(['a']), new Set(['a']));
		expect(first.hidden).toBeUndefined();
		expect(first.locked).toBeUndefined();
		expect(source).toEqual([first]);
	});

	it('неизвестные id в наборах игнорируются', () => {
		const first = column('a');
		const [item] = applyColumnState([first], new Set(['nope']), new Set(['nope']));
		expect(item).toBe(first);
	});
});
