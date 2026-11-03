import { describe, expect, it } from 'vitest';

import { buildTreeIndex } from './build-tree-index';
import type { TreeEntry } from './tree-entry';

interface Doc {
	id: number;
	parent: number | null;
}

const key = (row: Doc): number => row.id;
const parent = (row: Doc): number | null => row.parent;
const ids = (list: readonly TreeEntry<Doc>[] | undefined): number[] => (list ?? []).map((entry) => entry.key as number);

describe('buildTreeIndex', () => {
	it('делит строки на корни и детей в порядке rows', () => {
		const rows: Doc[] = [{ id: 1, parent: null }, { id: 2, parent: 1 }, { id: 3, parent: null }, { id: 4, parent: 1 }];
		const index = buildTreeIndex(rows, key, parent);
		expect(ids(index.roots)).toEqual([1, 3]);
		expect(ids(index.children.get(1))).toEqual([2, 4]);
		expect(index.children.has(3)).toBe(false);
		expect(index.byKey.get(4)?.row).toBe(rows[3]);
	});

	it('узел, чьего родителя нет в списке, становится корнем', () => {
		const index = buildTreeIndex([{ id: 1, parent: 99 }], key, parent);
		expect(ids(index.roots)).toEqual([1]);
	});

	it('undefined и сам себе родитель дают корень', () => {
		const rows = [{ id: 1, parent: undefined as unknown as null }, { id: 2, parent: 2 }];
		expect(ids(buildTreeIndex(rows, key, parent).roots)).toEqual([1, 2]);
	});

	it('цикл разрывается: первый узел цикла становится корнем', () => {
		const rows: Doc[] = [{ id: 1, parent: 2 }, { id: 2, parent: 1 }, { id: 3, parent: 2 }];
		const index = buildTreeIndex(rows, key, parent);
		expect(ids(index.roots)).toEqual([1]);
		expect(ids(index.children.get(1))).toEqual([2]);
		expect(ids(index.children.get(2))).toEqual([3]);
	});

	it('повтор ключа пропускается', () => {
		const index = buildTreeIndex([{ id: 1, parent: null }, { id: 1, parent: null }], key, parent);
		expect(ids(index.roots)).toEqual([1]);
	});
});
