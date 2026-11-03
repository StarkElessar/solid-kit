import { describe, expect, it } from 'vitest';

import type { FlatItems } from '../grid/flat-items';
import type { RowKey } from '../grid/row-key';

import { buildTreeIndex } from './build-tree-index';
import { flattenTree } from './flatten-tree';

interface Doc {
	id: number;
	parent: number | null;
}

const key = (row: Doc): number => row.id;
const parent = (row: Doc): number | null => row.parent;
const ROWS: readonly Doc[] = [
	{ id: 1, parent: null }, { id: 2, parent: 1 }, { id: 3, parent: 2 }, { id: 4, parent: 1 }, { id: 5, parent: null }
];
const index = buildTreeIndex(ROWS, key, parent);
const open = (...keys: number[]): ReadonlySet<RowKey> => new Set<RowKey>(keys);

// «id@уровень», затем «+» у свёрнутого раскрываемого и «-» у развёрнутого узла
function shape(flat: FlatItems<Doc>): string[] {
	return flat.items.map((item) => {
		if (item.kind !== 'row') {
			return `${item.kind}@${item.level}`;
		}
		const mark = item.node?.expanded === true ? '-' : item.node?.expandable === true ? '+' : '';
		return `${item.row.id}@${item.level}${mark}`;
	});
}

describe('flattenTree', () => {
	it('всё свёрнуто: только корни, у узлов с детьми плюс', () => {
		expect(shape(flattenTree(index, open(), undefined, open()))).toEqual(['1@0+', '5@0']);
	});

	it('раскрытый узел показывает детей глубже на уровень, порядок «родитель, дети»', () => {
		expect(shape(flattenTree(index, open(1, 2), undefined, open()))).toEqual(['1@0-', '2@1-', '3@2', '4@1', '5@0']);
	});

	it('ребёнок свёрнутого родителя скрыт, даже если раскрыт сам', () => {
		expect(shape(flattenTree(index, open(2), undefined, open()))).toEqual(['1@0+', '5@0']);
	});

	it('rows и rowIndex идут по видимым строкам', () => {
		const flat = flattenTree(index, open(1), undefined, open());
		expect(flat.rows.map((row) => row.id)).toEqual([1, 2, 4, 5]);
		expect(flat.items.map((item) => (item.kind === 'row' ? item.rowIndex : -1))).toEqual([0, 1, 2, 3]);
	});

	it('setSize и posInSet считаются среди соседей', () => {
		const flat = flattenTree(index, open(1), undefined, open());
		const node = (id: number) => flat.items.find((item) => item.kind === 'row' && item.row.id === id);
		expect(node(4)).toMatchObject({ node: { setSize: 2, posInSet: 2 } });
		expect(node(2)).toMatchObject({ node: { setSize: 2, posInSet: 1 } });
		expect(node(5)).toMatchObject({ node: { setSize: 2, posInSet: 2 } });
	});

	it('hasChildren делает узел раскрываемым без детей, заглушка только если ключ в loading', () => {
		const hasChildren = (row: Doc): boolean => row.id === 5;
		expect(shape(flattenTree(index, open(), hasChildren, open()))).toEqual(['1@0+', '5@0+']);
		expect(shape(flattenTree(index, open(5), hasChildren, open(5)))).toEqual(['1@0+', '5@0-', 'loading@1']);
		expect(shape(flattenTree(index, open(5), hasChildren, open()))).toEqual(['1@0+', '5@0-']);
	});

	it('раскрытие узла-листа без hasChildren ничего не меняет', () => {
		expect(shape(flattenTree(index, open(5), undefined, open()))).toEqual(['1@0+', '5@0']);
	});

	it('глубокая цепочка не переполняет стек', () => {
		const chain = Array.from({ length: 20000 }, (_, i) => ({ id: i + 1, parent: i === 0 ? null : i }));
		const deep = buildTreeIndex(chain, key, parent);
		const all = new Set<RowKey>(chain.map((row) => row.id));
		expect(flattenTree(deep, all, undefined, open()).items).toHaveLength(20000);
	});
});
