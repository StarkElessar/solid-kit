import { describe, expect, it } from 'vitest';

/*
 * Единство с гридом (спек TreeList, раздел 2): всё общее живёт в `grid/` в одном экземпляре. В `tree-list/` нет стилей, нет файлов с
 * именами из `grid/` и нет собственной разметки таблицы, кнопок и значков: вид рисуют только общие компоненты грида.
 */

const TREE_FILES = import.meta.glob('/src/components/tree-list/*', { query: '?raw', import: 'default', eager: true });
const GRID_FILES = import.meta.glob('/src/components/grid/*', { query: '?raw', import: 'default', eager: true });

const baseName = (path: string): string => path.slice(path.lastIndexOf('/') + 1);
const withoutTest = (name: string): string => name.replace(/\.test(?=\.)/, '');

describe('TreeList делит код с гридом', () => {
	it('в каталоге нет стилей', () => {
		const styles = Object.keys(TREE_FILES).filter((path) => path.endsWith('.css'));
		expect(styles).toEqual([]);
	});

	it('имена файлов не повторяют файлы грида', () => {
		const gridNames = new Set(Object.keys(GRID_FILES).map((path) => withoutTest(baseName(path))));
		// `index.ts` есть у каждого компонента (точка входа пакета), это не копия
		const names = Object.keys(TREE_FILES).map((path) => withoutTest(baseName(path))).filter((name) => name !== 'index.ts');
		const clones = names.filter((name) => gridNames.has(name));
		expect(clones).toEqual([]);
	});

	it('компоненты не рисуют таблицу, кнопки и значки сами', () => {
		const own = Object.entries(TREE_FILES)
			.filter(([path]) => path.endsWith('.tsx') && !path.endsWith('.test.tsx'))
			.filter(([, source]) => /<(table|thead|tbody|button|svg)\b/.test(source))
			.map(([path]) => baseName(path));
		expect(own).toEqual([]);
	});
});
