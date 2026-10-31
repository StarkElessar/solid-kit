import { describe, expect, it } from 'vitest';

import type { GridSort } from './grid-sort';
import { nextSort } from './next-sort';

describe('nextSort', () => {
	it('без сортировки начинает с asc', () => {
		expect(nextSort(null, 'name')).toEqual({ columnId: 'name', direction: 'asc' });
	});

	it('та же колонка: asc → desc → сброс', () => {
		const asc: GridSort = { columnId: 'name', direction: 'asc' };
		const desc = nextSort(asc, 'name');
		expect(desc).toEqual({ columnId: 'name', direction: 'desc' });
		expect(nextSort(desc, 'name')).toBeNull();
	});

	it('другая колонка начинает с asc независимо от прежнего направления', () => {
		expect(nextSort({ columnId: 'name', direction: 'desc' }, 'age')).toEqual({ columnId: 'age', direction: 'asc' });
	});

	it('возвращает новый объект и не меняет вход', () => {
		const current: GridSort = { columnId: 'name', direction: 'asc' };
		const next = nextSort(current, 'name');
		expect(next).not.toBe(current);
		expect(current).toEqual({ columnId: 'name', direction: 'asc' });
	});
});
