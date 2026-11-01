import { describe, expect, it } from 'vitest';

import { allGroupKeys } from './all-group-keys';
import { collapseLevelKeys } from './collapse-level-keys';
import { expandLevelKeys } from './expand-level-keys';
import type { GridGroup } from './grid-group';

function leaf(key: string): GridGroup<unknown> {
	return { key, field: 'f', value: key, count: 1, children: { kind: 'rows', items: [] } };
}

function node(key: string, ...items: GridGroup<unknown>[]): GridGroup<unknown> {
	return { key, field: 'f', value: key, count: 1, children: { kind: 'groups', items } };
}

// a: a1, a2; b: b1
const TREE = [node('a', leaf('a1'), leaf('a2')), node('b', leaf('b1'))];

function sorted(keys: ReadonlySet<string>): string[] {
	return [...keys].sort();
}

describe('allGroupKeys', () => {
	it('собирает ключи всех уровней', () => {
		expect(sorted(allGroupKeys(TREE))).toEqual(['a', 'a1', 'a2', 'b', 'b1']);
	});
});

describe('expandLevelKeys', () => {
	it('все свёрнуты: разворачивает верхний уровень', () => {
		expect(sorted(expandLevelKeys(TREE, new Set()))).toEqual(['a', 'b']);
	});

	it('верхний развёрнут: разворачивает следующий уровень видимых свёрнутых', () => {
		expect(sorted(expandLevelKeys(TREE, new Set(['a', 'b'])))).toEqual(['a', 'a1', 'a2', 'b', 'b1']);
	});

	it('часть верхнего уровня свёрнута: сначала она', () => {
		expect(sorted(expandLevelKeys(TREE, new Set(['a'])))).toEqual(['a', 'b']);
	});

	it('группа под свёрнутым предком не берётся', () => {
		expect(sorted(expandLevelKeys(TREE, new Set(['a1'])))).toEqual(['a', 'a1', 'b']);
	});

	it('всё развёрнуто: тот же набор', () => {
		const all = allGroupKeys(TREE);
		expect(expandLevelKeys(TREE, all)).toBe(all);
	});
});

describe('collapseLevelKeys', () => {
	it('сворачивает самый глубокий развёрнутый уровень', () => {
		expect(sorted(collapseLevelKeys(TREE, new Set(['a', 'a1', 'b'])))).toEqual(['a', 'b']);
	});

	it('развёрнут только верхний: сворачивает его', () => {
		expect(sorted(collapseLevelKeys(TREE, new Set(['a', 'b'])))).toEqual([]);
	});

	it('развёрнутая группа под свёрнутым предком не учитывается', () => {
		expect(sorted(collapseLevelKeys(TREE, new Set(['a1', 'b'])))).toEqual(['a1']);
	});

	it('ничего не развёрнуто: тот же набор', () => {
		const none = new Set<string>();
		expect(collapseLevelKeys(TREE, none)).toBe(none);
	});
});
