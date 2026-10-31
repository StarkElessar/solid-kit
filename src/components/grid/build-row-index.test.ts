import { describe, expect, it, vi } from 'vitest';

import { buildRowIndex } from './build-row-index';

interface Row {
	id: string | number;
}

describe('buildRowIndex', () => {
	it('ключи идут в порядке строк, индекс берётся по ключу', () => {
		const result = buildRowIndex<Row>([{ id: 'a' }, { id: 7 }, { id: 'c' }], (row) => row.id);
		expect(result.keys).toEqual(['a', 7, 'c']);
		expect(result.indexByKey.get('a')).toBe(0);
		expect(result.indexByKey.get(7)).toBe(1);
		expect(result.indexByKey.get('c')).toBe(2);
		expect(result.indexByKey.get('нет')).toBeUndefined();
	});

	it('getRowKey вызывается ровно один раз на строку', () => {
		const getRowKey = vi.fn((row: Row) => row.id);
		buildRowIndex([{ id: 1 }, { id: 2 }, { id: 3 }], getRowKey);
		expect(getRowKey).toHaveBeenCalledTimes(3);
	});

	it('при повторе ключа остаётся индекс первой строки', () => {
		const result = buildRowIndex<Row>([{ id: 1 }, { id: 2 }, { id: 1 }], (row) => row.id);
		expect(result.keys).toEqual([1, 2, 1]);
		expect(result.indexByKey.get(1)).toBe(0);
	});

	it('пустой список', () => {
		const result = buildRowIndex<Row>([], (row) => row.id);
		expect(result.keys).toEqual([]);
		expect(result.indexByKey.size).toBe(0);
	});
});
