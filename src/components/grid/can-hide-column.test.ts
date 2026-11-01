import { describe, expect, it } from 'vitest';

import { canHideColumn } from './can-hide-column';
import type { GridColumn } from './grid-column';

function column(id: string): GridColumn<unknown> {
	return { id, title: id, value: () => null };
}

describe('canHideColumn', () => {
	const columns = [column('a'), column('b'), column('c')];

	it('можно скрыть, когда видимых больше одной', () => {
		expect(canHideColumn(columns, new Set(), 'a')).toBe(true);
		expect(canHideColumn(columns, new Set(['c']), 'a')).toBe(true);
	});

	it('нельзя скрыть последнюю видимую', () => {
		expect(canHideColumn(columns, new Set(['b', 'c']), 'a')).toBe(false);
	});

	it('уже скрытую колонку можно переключать (показать), даже если видимых нет', () => {
		expect(canHideColumn(columns, new Set(['a', 'b', 'c']), 'a')).toBe(true);
		expect(canHideColumn(columns, new Set(['b', 'c']), 'b')).toBe(true);
	});

	it('единственная колонка списка не скрывается', () => {
		expect(canHideColumn([column('a')], new Set(), 'a')).toBe(false);
	});
});
