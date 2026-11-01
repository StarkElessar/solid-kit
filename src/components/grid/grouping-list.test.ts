import { describe, expect, it } from 'vitest';

import { addGrouping } from './add-grouping';
import { insertionSlot } from './insertion-slot';
import { placeGrouping } from './place-grouping';
import { removeGrouping } from './remove-grouping';

describe('addGrouping', () => {
	it('добавляет в конец без дублей', () => {
		expect(addGrouping(['a'], 'b')).toEqual(['a', 'b']);
		const list = ['a'];
		expect(addGrouping(list, 'a')).toBe(list);
	});
});

describe('removeGrouping', () => {
	it('убирает колонку, отсутствующая возвращает тот же массив', () => {
		expect(removeGrouping(['a', 'b'], 'a')).toEqual(['b']);
		const list = ['a'];
		expect(removeGrouping(list, 'x')).toBe(list);
	});
});

describe('placeGrouping', () => {
	it.each([
		[['a', 'b', 'c'], 'x', 0, ['x', 'a', 'b', 'c']],
		[['a', 'b', 'c'], 'x', 3, ['a', 'b', 'c', 'x']],
		[['a', 'b', 'c'], 'a', 3, ['b', 'c', 'a']],
		[['a', 'b', 'c'], 'c', 0, ['c', 'a', 'b']],
		[['a', 'b', 'c'], 'b', 3, ['a', 'c', 'b']],
		[['a', 'b', 'c'], 'x', 99, ['a', 'b', 'c', 'x']]
	])('%j: %s в щель %i', (list, id, slot, expected) => {
		expect(placeGrouping(list, id, slot)).toEqual(expected);
	});

	it('щель до и после самой колонки не меняет порядок и возвращает тот же массив', () => {
		const list = ['a', 'b', 'c'];
		expect(placeGrouping(list, 'b', 1)).toBe(list);
		expect(placeGrouping(list, 'b', 2)).toBe(list);
	});
});

describe('insertionSlot', () => {
	it.each([
		[[10, 30, 50], 0, 0],
		[[10, 30, 50], 20, 1],
		[[10, 30, 50], 50, 2],
		[[10, 30, 50], 99, 3],
		[[], 5, 0]
	])('центры %j, x %i: щель %i', (centers, x, expected) => {
		expect(insertionSlot(centers, x)).toBe(expected);
	});
});
