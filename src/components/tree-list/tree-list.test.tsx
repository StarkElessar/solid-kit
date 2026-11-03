import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { batch, createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { GridColumn } from '../grid/grid-column';
import type { RowKey } from '../grid/row-key';

import { TreeList } from './tree-list';

afterEach(cleanup);

interface Doc {
	id: number;
	parent: number | null;
	title: string;
	kind: string;
}

const DOCS: readonly Doc[] = [
	{ id: 1, parent: null, title: 'Регламенты', kind: 'Раздел' },
	{ id: 2, parent: 1, title: 'Продажи', kind: 'Регламент' },
	{ id: 3, parent: 2, title: 'Скидки', kind: 'Регламент' },
	{ id: 4, parent: 1, title: 'Возвраты', kind: 'Регламент' },
	{ id: 5, parent: null, title: 'Архив', kind: 'Раздел' }
];

const COLUMNS: readonly GridColumn<Doc>[] = [
	{ id: 'title', title: 'Название', value: (row) => row.title, width: 240 },
	{ id: 'kind', title: 'Тип', value: (row) => row.kind, width: 120 }
];

function renderTree(overrides: Partial<Parameters<typeof TreeList<Doc>>[0]> = {}) {
	return render(() => (
		<TreeList
			rows={DOCS}
			getRowKey={(row) => row.id}
			getParentKey={(row) => row.parent}
			columns={COLUMNS}
			virtualized={false}
			aria-label='Документы'
			{...overrides}
		/>
	));
}

function table(): HTMLTableElement {
	return screen.getByRole<HTMLTableElement>('treegrid', { name: 'Документы' });
}

function bodyRows(): HTMLTableRowElement[] {
	return [...table().querySelectorAll<HTMLTableRowElement>('tbody > tr[data-index]')];
}

function titles(): (string | null | undefined)[] {
	return bodyRows().map((tr) => tr.querySelector('td')?.textContent);
}

describe('TreeList: плоский список с parentKey', () => {
	it('таблица имеет role=treegrid, по умолчанию видны только корни', () => {
		renderTree();
		expect(titles()).toEqual(['Регламенты', 'Архив']);
	});

	it('defaultExpandedKeys раскрывает узлы', () => {
		renderTree({ defaultExpandedKeys: new Set([1]) });
		expect(titles()).toEqual(['Регламенты', 'Продажи', 'Возвраты', 'Архив']);
	});

	it('клик по шеврону раскрывает узел, сообщает набор и меняет подпись', () => {
		const onExpandedKeysChange = vi.fn();
		renderTree({ onExpandedKeysChange });
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Регламенты' }));
		expect(titles()).toEqual(['Регламенты', 'Продажи', 'Возвраты', 'Архив']);
		expect(onExpandedKeysChange).toHaveBeenCalledWith(new Set([1]));
		expect(screen.getByRole('button', { name: 'Свернуть Регламенты' }).getAttribute('aria-expanded')).toBe('true');
		expect(bodyRows()[0]?.getAttribute('aria-expanded')).toBe('true');
	});

	it('строки получают aria-level, aria-setsize и aria-posinset, у листа нет aria-expanded', () => {
		renderTree({ defaultExpandedKeys: new Set([1, 2]) });
		const rows = bodyRows();
		expect(rows.map((tr) => tr.getAttribute('aria-level'))).toEqual(['1', '2', '3', '2', '1']);
		expect(rows[1]?.getAttribute('aria-setsize')).toBe('2');
		expect(rows[1]?.getAttribute('aria-posinset')).toBe('1');
		expect(rows[3]?.getAttribute('aria-posinset')).toBe('2');
		expect(rows[2]?.hasAttribute('aria-expanded')).toBe(false);
		expect(rows[4]?.hasAttribute('aria-expanded')).toBe(false);
	});

	it('отступ строки растёт на 16 px за уровень', () => {
		renderTree({ defaultExpandedKeys: new Set([1, 2]) });
		const indents = bodyRows().map((tr) => tr.style.getPropertyValue('--s-kit-grid-indent'));
		expect(indents).toEqual(['', '16px', '32px', '16px', '']);
	});

	it('контролируемый expandedKeys не меняется без ответа страницы', () => {
		const onExpandedKeysChange = vi.fn();
		renderTree({ expandedKeys: new Set<RowKey>(), onExpandedKeysChange });
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Регламенты' }));
		expect(onExpandedKeysChange).toHaveBeenCalledWith(new Set([1]));
		expect(titles()).toEqual(['Регламенты', 'Архив']);
	});

	it('лист рисует пустое место вместо кнопки', () => {
		renderTree();
		const leaf = bodyRows()[1]?.querySelector('td');
		expect(leaf?.querySelector('button')).toBeNull();
		expect(leaf?.querySelector('span[aria-hidden="true"]')).not.toBeNull();
	});

	it('выбор строк работает как в гриде', () => {
		const onSelectedKeysChange = vi.fn();
		renderTree({ selectable: true, onSelectedKeysChange });
		fireEvent.click(bodyRows()[1]?.querySelectorAll('td')[2] as HTMLElement);
		expect(onSelectedKeysChange).toHaveBeenCalledWith(new Set([5]));
	});

	it('пустой rows показывает «Ничего не найдено»', () => {
		renderTree({ rows: [] });
		expect(screen.getByText('Ничего не найдено')).toBeTruthy();
	});
});

describe('TreeList: кнопки уровней', () => {
	const button = (name: string): HTMLButtonElement => screen.getByRole<HTMLButtonElement>('button', { name });

	it('полоса с четырьмя кнопками в нужном порядке, панели группировки нет', () => {
		const { container } = renderTree();
		const buttons = container.querySelectorAll<HTMLButtonElement>('[class*="toolbar"] button');
		const names = [...buttons].map((item) => item.getAttribute('aria-label'));
		expect(names).toEqual(['Свернуть уровень', 'Свернуть все', 'Развернуть уровень', 'Развернуть все']);
		expect(container.querySelector('[data-grouping-panel]')).toBeNull();
	});

	it('«Развернуть уровень» раскрывает уровень за уровнем, на краю колбэк не вызывается', () => {
		const onExpandedKeysChange = vi.fn();
		renderTree({ onExpandedKeysChange });
		fireEvent.click(button('Развернуть уровень'));
		expect(onExpandedKeysChange).toHaveBeenLastCalledWith(new Set([1]));
		fireEvent.click(button('Развернуть уровень'));
		expect(onExpandedKeysChange).toHaveBeenLastCalledWith(new Set([1, 2]));
		onExpandedKeysChange.mockClear();
		fireEvent.click(button('Развернуть уровень'));
		expect(onExpandedKeysChange).not.toHaveBeenCalled();
	});

	it('«Развернуть все», «Свернуть уровень» и «Свернуть все»', () => {
		const onExpandedKeysChange = vi.fn();
		renderTree({ onExpandedKeysChange });
		fireEvent.click(button('Развернуть все'));
		expect(onExpandedKeysChange).toHaveBeenLastCalledWith(new Set([1, 2]));
		expect(titles()).toEqual(['Регламенты', 'Продажи', 'Скидки', 'Возвраты', 'Архив']);
		fireEvent.click(button('Свернуть уровень'));
		expect(onExpandedKeysChange).toHaveBeenLastCalledWith(new Set([1]));
		fireEvent.click(button('Свернуть все'));
		expect(onExpandedKeysChange).toHaveBeenLastCalledWith(new Set());
		expect(titles()).toEqual(['Регламенты', 'Архив']);
	});

	it('при загрузке и при пустом списке кнопки отключены', () => {
		renderTree({ loading: true });
		expect(button('Развернуть все').disabled).toBe(true);
		cleanup();
		renderTree({ rows: [] });
		expect(button('Развернуть все').disabled).toBe(true);
	});

	it('levelLabels переопределяет подписи', () => {
		renderTree({ levelLabels: { expandAll: 'Раскрыть всё', expand: (title) => `Раскрыть ${title}` } });
		expect(button('Раскрыть всё')).toBeTruthy();
		expect(button('Раскрыть Регламенты')).toBeTruthy();
	});
});

interface LazyDoc {
	id: number;
	parent: number | null;
	title: string;
	kids: boolean;
}

const LAZY_COLUMNS: readonly GridColumn<LazyDoc>[] = [{ id: 'title', title: 'Название', value: (row) => row.title, width: 240 }];

// страница ленивого режима: держит строки и ключи догрузки, `loadChildren` кладёт ключ в loadingKeys синхронно
function renderLazy(overrides: Partial<Parameters<typeof TreeList<LazyDoc>>[0]> = {}) {
	const [rows, setRows] = createSignal<readonly LazyDoc[]>([
		{ id: 1, parent: null, title: 'Раздел А', kids: true },
		{ id: 2, parent: null, title: 'Раздел Б', kids: true },
		{ id: 3, parent: null, title: 'Пустой', kids: false }
	]);
	const [loading, setLoading] = createSignal<ReadonlySet<RowKey>>(new Set());
	const loadChildren = vi.fn((row: LazyDoc) => {
		setLoading((current) => new Set(current).add(row.id));
	});
	render(() => (
		<TreeList
			rows={rows()}
			getRowKey={(row: LazyDoc) => row.id}
			getParentKey={(row: LazyDoc) => row.parent}
			hasChildren={(row: LazyDoc) => row.kids}
			loadChildren={loadChildren}
			loadingKeys={loading()}
			columns={LAZY_COLUMNS}
			virtualized={false}
			aria-label='Документы'
			{...(overrides as object)}
		/>
	));
	// ответ сервера: дети добавлены, ключ снят с догрузки
	const finish = (id: number, children: readonly LazyDoc[]): void => {
		batch(() => {
			setRows((current) => [...current, ...children]);
			setLoading((current) => {
				const next = new Set(current);
				next.delete(id);
				return next;
			});
		});
	};
	return { loadChildren, finish };
}

describe('TreeList: ленивая подгрузка', () => {
	it('раскрытие узла без детей показывает «Загрузка…» и один раз просит дети', () => {
		const { loadChildren } = renderLazy();
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Раздел А' }));
		expect(titles()).toEqual(['Раздел А', 'Загрузка…', 'Раздел Б', 'Пустой']);
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(loadChildren.mock.calls[0]?.[0]).toMatchObject({ id: 1 });
	});

	it('после ответа строка загрузки исчезает, дети показаны глубже на уровень', () => {
		const { finish } = renderLazy();
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Раздел А' }));
		finish(1, [{ id: 10, parent: 1, title: 'Документ', kids: false }]);
		expect(titles()).toEqual(['Раздел А', 'Документ', 'Раздел Б', 'Пустой']);
		expect(bodyRows()[1]?.getAttribute('aria-level')).toBe('2');
	});

	it('повторное раскрытие узла с загруженными детьми не просит их снова', () => {
		const { loadChildren, finish } = renderLazy();
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Раздел А' }));
		finish(1, [{ id: 10, parent: 1, title: 'Документ', kids: false }]);
		fireEvent.click(screen.getByRole('button', { name: 'Свернуть Раздел А' }));
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Раздел А' }));
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(titles()).toEqual(['Раздел А', 'Документ', 'Раздел Б', 'Пустой']);
	});

	it('узел, дети которого не пришли, после сворачивания запрашивается заново', () => {
		const { loadChildren, finish } = renderLazy();
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Раздел А' }));
		finish(1, []);
		expect(titles()).toEqual(['Раздел А', 'Раздел Б', 'Пустой']);
		fireEvent.click(screen.getByRole('button', { name: 'Свернуть Раздел А' }));
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Раздел А' }));
		expect(loadChildren).toHaveBeenCalledTimes(2);
	});

	it('«Развернуть уровень» догружает все узлы уровня', () => {
		const { loadChildren } = renderLazy();
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть уровень' }));
		expect(loadChildren).toHaveBeenCalledTimes(2);
	});

	it('«Развернуть все» в ленивом режиме отключена, в обычном доступна', () => {
		const { loadChildren } = renderLazy();
		const expandAll = screen.getByRole<HTMLButtonElement>('button', { name: 'Развернуть все' });
		expect(expandAll.disabled).toBe(true);
		fireEvent.click(expandAll);
		expect(loadChildren).not.toHaveBeenCalled();
		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Развернуть уровень' }).disabled).toBe(false);
		cleanup();
		renderTree();
		expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Развернуть все' }).disabled).toBe(false);
	});

	it('строка «Загрузка…» не выбирается', () => {
		const onSelectedKeysChange = vi.fn();
		renderLazy({ selectable: true, onSelectedKeysChange });
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть Раздел А' }));
		fireEvent.click(screen.getByText('Загрузка…'));
		expect(onSelectedKeysChange).not.toHaveBeenCalled();
	});
});
