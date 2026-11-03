import { describe, expect, it } from 'vitest';

import type { RowKey } from '../grid/row-key';

import { allTreeKeys } from './all-tree-keys';
import { buildTreeIndex } from './build-tree-index';
import { collapseTreeLevelKeys } from './collapse-tree-level-keys';
import { expandTreeLevelKeys } from './expand-tree-level-keys';
import { flattenTree } from './flatten-tree';
import { loadingNodeKeys } from './loading-node-keys';

interface Doc {
	id: number;
	parent: number | null;
}

const ROWS: readonly Doc[] = [
	{ id: 1, parent: null }, { id: 2, parent: 1 }, { id: 3, parent: 2 }, { id: 4, parent: 1 }, { id: 5, parent: null }
];
const index = buildTreeIndex(ROWS, (row) => row.id, (row) => row.parent);
const open = (...keys: number[]): ReadonlySet<RowKey> => new Set<RowKey>(keys);
const items = (expanded: ReadonlySet<RowKey>) => flattenTree(index, expanded, undefined, open()).items;
const sorted = (keys: ReadonlySet<RowKey>): RowKey[] => [...keys].sort();

describe('collapseTreeLevelKeys', () => {
	it('сворачивает раскрытые узлы наибольшей глубины', () => {
		expect(sorted(collapseTreeLevelKeys(items(open(1, 2)), open(1, 2)))).toEqual([1]);
	});

	it('нечего сворачивать: тот же набор', () => {
		const expanded = open();
		expect(collapseTreeLevelKeys(items(expanded), expanded)).toBe(expanded);
	});
});

describe('expandTreeLevelKeys', () => {
	it('раскрывает свёрнутые узлы наименьшей глубины, лист не трогает', () => {
		expect(sorted(expandTreeLevelKeys(items(open()), open()))).toEqual([1]);
		expect(sorted(expandTreeLevelKeys(items(open(1)), open(1)))).toEqual([1, 2]);
	});

	it('нечего раскрывать: тот же набор', () => {
		const expanded = open(1, 2);
		expect(expandTreeLevelKeys(items(expanded), expanded)).toBe(expanded);
	});
});

describe('allTreeKeys', () => {
	it('добавляет узлы с загруженными детьми к раскрытым', () => {
		expect(sorted(allTreeKeys(index, open()))).toEqual([1, 2]);
		expect(sorted(allTreeKeys(index, open(1, 9)))).toEqual([1, 2, 9]);
	});

	it('всё уже раскрыто: тот же набор', () => {
		const expanded = open(1, 2);
		expect(allTreeKeys(index, expanded)).toBe(expanded);
	});
});

describe('loadingNodeKeys', () => {
	const hasChildren = (row: Doc): boolean => row.id === 5;

	it('без hasChildren возвращает loading как есть', () => {
		const loading = open(1);
		expect(loadingNodeKeys(index, open(5), open(), loading, undefined)).toBe(loading);
	});

	it('раскрытый узел без детей, не запрошенный и с hasChildren, добавляется', () => {
		expect(sorted(loadingNodeKeys(index, open(5), open(), open(), hasChildren))).toEqual([5]);
	});

	it('запрошенный узел не добавляется, узел с детьми тоже', () => {
		expect(sorted(loadingNodeKeys(index, open(5), open(5), open(), hasChildren))).toEqual([]);
		expect(sorted(loadingNodeKeys(index, open(1), open(), open(), (row) => row.id === 1))).toEqual([]);
	});

	it('идущая догрузка сохраняется', () => {
		expect(sorted(loadingNodeKeys(index, open(5), open(5), open(5), hasChildren))).toEqual([5]);
	});
});
