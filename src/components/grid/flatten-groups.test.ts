import { describe, expect, it } from 'vitest';

import { flattenGroups } from './flatten-groups';
import type { GridGroup } from './grid-group';

type Row = { id: number };

function rowsGroup(key: string, ids: number[], withSums = false): GridGroup<Row> {
	return {
		key,
		field: 'f',
		value: key,
		count: ids.length,
		aggregates: withSums ? { sum: 1 } : undefined,
		children: { kind: 'rows', items: ids.map((id) => ({ id })) }
	};
}

function kinds(groups: readonly GridGroup<Row>[], expanded: string[]): string[] {
	return flattenGroups(groups, new Set(expanded)).items.map((item) => {
		if (item.kind === 'row') {
			return `row${item.row.id}@${item.level}`;
		}
		if (item.kind === 'group') {
			return `${item.expanded ? 'open' : 'closed'}:${item.group.key}@${item.level}`;
		}
		return `${item.kind}@${item.level}`;
	});
}

describe('flattenGroups', () => {
	it('свёрнутая группа без агрегатов даёт только заголовок и не даёт строк', () => {
		const result = flattenGroups([rowsGroup('a', [1, 2])], new Set());
		expect(result.items).toHaveLength(1);
		expect(result.rows).toEqual([]);
	});

	it('свёрнутая группа с агрегатами даёт заголовок и подвал, без строк и вложенных групп', () => {
		expect(kinds([rowsGroup('a', [1, 2], true)], [])).toEqual(['closed:a@0', 'footer@0']);
		const parent: GridGroup<Row> = {
			key: 'p',
			field: 'f',
			value: 'p',
			count: 1,
			aggregates: { sum: 1 },
			children: { kind: 'groups', items: [rowsGroup('p/a', [1], true)] }
		};
		expect(kinds([parent], [])).toEqual(['closed:p@0', 'footer@0']);
	});

	it('развёрнутая: заголовок, строки уровнем глубже, подвал только с агрегатами', () => {
		expect(kinds([rowsGroup('a', [1, 2], true)], ['a'])).toEqual(['open:a@0', 'row1@1', 'row2@1', 'footer@0']);
		expect(kinds([rowsGroup('a', [1])], ['a'])).toEqual(['open:a@0', 'row1@1']);
	});

	it('вложенные группы: свёрнутая дочерняя даёт только заголовок', () => {
		const parent: GridGroup<Row> = {
			key: 'p',
			field: 'f',
			value: 'p',
			count: 3,
			children: { kind: 'groups', items: [rowsGroup('p/a', [1]), rowsGroup('p/b', [2])] }
		};
		expect(kinds([parent], ['p', 'p/a'])).toEqual(['open:p@0', 'open:p/a@1', 'row1@2', 'closed:p/b@1']);
	});

	it('rowIndex сквозной по листовым строкам, rows в порядке показа', () => {
		const result = flattenGroups([rowsGroup('a', [10, 11]), rowsGroup('b', [12])], new Set(['a', 'b']));
		expect(result.rows).toEqual([{ id: 10 }, { id: 11 }, { id: 12 }]);
		const indexes = result.items.flatMap((item) => (item.kind === 'row' ? [item.rowIndex] : []));
		expect(indexes).toEqual([0, 1, 2]);
	});

	it('развёрнутая не загруженная группа даёт заглушку', () => {
		const lazy: GridGroup<Row> = { key: 'l', field: 'f', value: 'l', count: 50, children: { kind: 'not-loaded' } };
		expect(kinds([lazy], ['l'])).toEqual(['open:l@0', 'loading@1']);
		expect(kinds([lazy], [])).toEqual(['closed:l@0']);
	});

	it('пустой список дерева даёт пустой результат', () => {
		expect(flattenGroups([], new Set())).toEqual({ items: [], rows: [] });
	});
});
