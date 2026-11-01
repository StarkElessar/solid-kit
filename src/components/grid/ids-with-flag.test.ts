import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import { idsWithFlag } from './ids-with-flag';

function column(id: string, extra: Partial<GridColumn<unknown>> = {}): GridColumn<unknown> {
	return { id, title: id, value: () => null, ...extra };
}

describe('idsWithFlag', () => {
	const columns = [
		column('a', { hidden: true }),
		column('b', { locked: true }),
		column('c', { hidden: true, locked: true }),
		column('d')
	];

	it('hidden собирает id колонок с hidden: true', () => {
		expect([...idsWithFlag(columns, 'hidden')]).toEqual(['a', 'c']);
	});

	it('locked собирает id колонок с locked: true', () => {
		expect([...idsWithFlag(columns, 'locked')]).toEqual(['b', 'c']);
	});

	it('hidden: false и отсутствие поля не считаются', () => {
		expect(idsWithFlag([column('x', { hidden: false }), column('y')], 'hidden').size).toBe(0);
	});

	it('пустой список даёт пустой набор', () => {
		expect(idsWithFlag([], 'locked').size).toBe(0);
	});
});
