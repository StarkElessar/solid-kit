import { describe, expect, it } from 'vitest';

import { clearKeys, selectAllKeys, selectionOf, toggleKey } from './selection-state';

describe('toggleKey', () => {
	it('добавляет отсутствующий ключ и убирает присутствующий, вход не меняется', () => {
		const empty: ReadonlySet<number> = new Set();
		const added = toggleKey(empty, 1);
		expect([...added]).toEqual([1]);
		expect(empty.size).toBe(0);
		const removed = toggleKey(added, 1);
		expect(removed.size).toBe(0);
		expect([...added]).toEqual([1]);
	});

	it('работает со строковыми ключами', () => {
		expect(toggleKey(new Set(['a']), 'b').has('b')).toBe(true);
	});
});

describe('selectAllKeys', () => {
	it('добавляет все загруженные ключи и сохраняет чужие', () => {
		const result = selectAllKeys(new Set([99]), [1, 2, 3]);
		expect([...result].sort((a, b) => Number(a) - Number(b))).toEqual([1, 2, 3, 99]);
	});

	it('не меняет вход', () => {
		const input: ReadonlySet<number> = new Set([1]);
		selectAllKeys(input, [1, 2]);
		expect([...input]).toEqual([1]);
	});
});

describe('clearKeys', () => {
	it('убирает только загруженные ключи, ключи прошлых загрузок остаются', () => {
		const result = clearKeys(new Set([1, 2, 99]), [1, 2, 3]);
		expect([...result]).toEqual([99]);
	});

	it('не меняет вход', () => {
		const input: ReadonlySet<number> = new Set([1, 2]);
		clearKeys(input, [1]);
		expect([...input]).toEqual([1, 2]);
	});
});

describe('selectionOf', () => {
	it('считает только по загруженным ключам: ничего, часть, все', () => {
		expect(selectionOf(new Set<number>(), [1, 2])).toBe('none');
		expect(selectionOf(new Set([1]), [1, 2])).toBe('some');
		expect(selectionOf(new Set([1, 2]), [1, 2])).toBe('all');
	});

	it('чужие ключи состояние не меняют', () => {
		expect(selectionOf(new Set([99]), [1, 2])).toBe('none');
		expect(selectionOf(new Set([1, 2, 99]), [1, 2])).toBe('all');
	});

	it('пустой список загруженных даёт none', () => {
		expect(selectionOf(new Set([1]), [])).toBe('none');
	});
});
