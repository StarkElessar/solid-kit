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

// страница ленивого режима: держит строки и ключи догрузки, `loadChildren` кладёт ВСЕ ключи батча в loadingKeys синхронно
function renderLazy(overrides: Partial<Parameters<typeof TreeList<LazyDoc>>[0]> = {}) {
	const [rows, setRows] = createSignal<readonly LazyDoc[]>([
		{ id: 1, parent: null, title: 'Раздел А', kids: true },
		{ id: 2, parent: null, title: 'Раздел Б', kids: true },
		{ id: 3, parent: null, title: 'Пустой', kids: false }
	]);
	const [loading, setLoading] = createSignal<ReadonlySet<RowKey>>(new Set());
	const loadChildren = vi.fn((batchRows: readonly LazyDoc[]) => {
		setLoading((current) => new Set([...current, ...batchRows.map((row) => row.id)]));
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
	// ответ сервера: дети добавлены, ключи родителей сняты с догрузки
	const finish = (ids: readonly number[], children: readonly LazyDoc[]): void => {
		batch(() => {
			setRows((current) => [...current, ...children]);
			setLoading((current) => {
				const next = new Set(current);
				ids.forEach((id) => next.delete(id));
				return next;
			});
		});
	};
	const batchIds = (call: number): (number | undefined)[] => (loadChildren.mock.calls[call]?.[0] ?? []).map((row) => row.id);
	return { loadChildren, finish, setRows, batchIds };
}

const expand = (name: string): void => {
	fireEvent.click(screen.getByRole('button', { name: `Развернуть ${name}` }));
};
const collapse = (name: string): void => {
	fireEvent.click(screen.getByRole('button', { name: `Свернуть ${name}` }));
};

describe('TreeList: ленивая подгрузка', () => {
	it('раскрытие узла без детей показывает «Загрузка…» и один раз просит дети массивом из одной строки', () => {
		const { loadChildren, batchIds } = renderLazy();
		expand('Раздел А');
		expect(titles()).toEqual(['Раздел А', 'Загрузка…', 'Раздел Б', 'Пустой']);
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(batchIds(0)).toEqual([1]);
	});

	it('после ответа строка загрузки исчезает, дети показаны глубже на уровень', () => {
		const { finish } = renderLazy();
		expand('Раздел А');
		finish([1], [{ id: 10, parent: 1, title: 'Документ', kids: false }]);
		expect(titles()).toEqual(['Раздел А', 'Документ', 'Раздел Б', 'Пустой']);
		expect(bodyRows()[1]?.getAttribute('aria-level')).toBe('2');
	});

	it('повторное раскрытие узла с загруженными детьми не просит их снова', () => {
		const { loadChildren, finish } = renderLazy();
		expand('Раздел А');
		finish([1], [{ id: 10, parent: 1, title: 'Документ', kids: false }]);
		collapse('Раздел А');
		expand('Раздел А');
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(titles()).toEqual(['Раздел А', 'Документ', 'Раздел Б', 'Пустой']);
	});

	it('пустой ответ: автоповтора нет, после сворачивания узел запрашивается заново', () => {
		const { loadChildren, finish } = renderLazy();
		expand('Раздел А');
		finish([1], []);
		expect(titles()).toEqual(['Раздел А', 'Раздел Б', 'Пустой']);
		expect(loadChildren).toHaveBeenCalledTimes(1);
		collapse('Раздел А');
		expand('Раздел А');
		expect(loadChildren).toHaveBeenCalledTimes(2);
	});

	it('«Развернуть уровень» догружает весь уровень одним вызовом в порядке экрана', () => {
		const { loadChildren, batchIds } = renderLazy();
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть уровень' }));
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(batchIds(0)).toEqual([1, 2]);
	});

	it('частичный ответ: пришли дети одного родителя, второй остаётся в загрузке', () => {
		const { loadChildren, finish } = renderLazy();
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть уровень' }));
		finish([1], [{ id: 10, parent: 1, title: 'Документ', kids: false }]);
		expect(titles()).toEqual(['Раздел А', 'Документ', 'Раздел Б', 'Загрузка…', 'Пустой']);
		expect(loadChildren).toHaveBeenCalledTimes(1);
	});

	it('свернуть и развернуть во время запроса не дублирует вызов', () => {
		const { loadChildren } = renderLazy();
		expand('Раздел А');
		collapse('Раздел А');
		expand('Раздел А');
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(titles()).toEqual(['Раздел А', 'Загрузка…', 'Раздел Б', 'Пустой']);
	});

	it('присоединение к идущему запросу тоже запоминается: пустой ответ не даёт автоповтора', () => {
		const { loadChildren, finish } = renderLazy();
		expand('Раздел А');
		collapse('Раздел А');
		expand('Раздел А');
		finish([1], []);
		expect(loadChildren).toHaveBeenCalledTimes(1);
	});

	it('«Обновить» через пустой список: пропавший и вернувшийся раскрытый узел запрашивается заново', () => {
		const { loadChildren, finish, setRows } = renderLazy();
		expand('Раздел А');
		finish([1], []);
		expect(loadChildren).toHaveBeenCalledTimes(1);
		setRows([]);
		setRows([
			{ id: 1, parent: null, title: 'Раздел А', kids: true },
			{ id: 2, parent: null, title: 'Раздел Б', kids: true },
			{ id: 3, parent: null, title: 'Пустой', kids: false }
		]);
		expect(loadChildren).toHaveBeenCalledTimes(2);
	});

	it('раскрытие второго узла при идущем запросе первого просит только второй', () => {
		const { loadChildren, batchIds } = renderLazy();
		expand('Раздел А');
		expand('Раздел Б');
		expect(loadChildren).toHaveBeenCalledTimes(2);
		expect(batchIds(1)).toEqual([2]);
	});

	it('смена rows без детей у раскрытого узла запрашивает его заново', () => {
		const { loadChildren, finish, setRows } = renderLazy();
		expand('Раздел А');
		finish([1], [{ id: 10, parent: 1, title: 'Документ', kids: false }]);
		expect(loadChildren).toHaveBeenCalledTimes(1);
		// «Обновить»: страница заменила данные, детей раскрытого узла в них нет
		setRows([
			{ id: 1, parent: null, title: 'Раздел А', kids: true },
			{ id: 2, parent: null, title: 'Раздел Б', kids: true }
		]);
		expect(loadChildren).toHaveBeenCalledTimes(2);
		expect(titles()).toEqual(['Раздел А', 'Загрузка…', 'Раздел Б']);
	});

	it('раскрытый узел внутри свёрнутого предка не запрашивается', () => {
		const { loadChildren, finish } = renderLazy({ defaultExpandedKeys: new Set<RowKey>([1, 10]) });
		expect(loadChildren).toHaveBeenCalledTimes(1);
		collapse('Раздел А');
		// дети А пришли, пока А свёрнут: вложенный раскрытый узел 10 скрыт, запрашивать его нельзя
		finish([1], [{ id: 10, parent: 1, title: 'Вложенный', kids: true }]);
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(titles()).toEqual(['Раздел А', 'Раздел Б', 'Пустой']);
		expand('Раздел А');
		expect(loadChildren).toHaveBeenCalledTimes(2);
	});

	it('контролируемый expandedKeys, который страница не приняла, вызова не даёт', () => {
		const { loadChildren } = renderLazy({ expandedKeys: new Set<RowKey>(), onExpandedKeysChange: vi.fn() });
		expand('Раздел А');
		expect(loadChildren).not.toHaveBeenCalled();
		expect(titles()).toEqual(['Раздел А', 'Раздел Б', 'Пустой']);
	});

	it('принятое страницей контролируемое раскрытие догружает пакет: два узла одним вызовом', () => {
		const [open, setOpen] = createSignal<ReadonlySet<RowKey>>(new Set());
		const controlled = {
			get expandedKeys() {
				return open();
			},
			onExpandedKeysChange: (keys: ReadonlySet<RowKey>) => setOpen(keys)
		};
		const { loadChildren, finish, batchIds } = renderLazy(controlled);
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть уровень' }));
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(batchIds(0)).toEqual([1, 2]);
		finish([1, 2], []);
		collapse('Раздел А');
		expand('Раздел А');
		expect(loadChildren).toHaveBeenCalledTimes(2);
		expect(batchIds(1)).toEqual([1]);
	});

	it('hasChildren=false убирает шеврон: узел-лист не запрашивается', () => {
		const { loadChildren } = renderLazy({ defaultExpandedKeys: new Set<RowKey>([3]) });
		expect(screen.queryByRole('button', { name: /Пустой/ })).toBeNull();
		expect(loadChildren).not.toHaveBeenCalled();
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
		expand('Раздел А');
		fireEvent.click(screen.getByText('Загрузка…'));
		expect(onSelectedKeysChange).not.toHaveBeenCalled();
	});

	it('ребёнок с getParentKey не равным ключу родителя становится корнем, а не догружается', () => {
		const { finish } = renderLazy();
		expand('Раздел А');
		// страница ошиблась с ключом родителя: строка осиротела и показана как корень
		finish([1], [{ id: 10, parent: 999, title: 'Сирота', kids: false }]);
		expect(titles()).toEqual(['Раздел А', 'Раздел Б', 'Пустой', 'Сирота']);
	});
});

describe('TreeList: ленивая подгрузка с виртуализацией', () => {
	const mockGeometry = (): void => {
		vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100);
		vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(400);
		vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
			return this.tagName === 'TR' ? 20 : 0;
		});
	};
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('500 узлов: «Развернуть уровень» даёт один вызов с 500 строками, прокрутка новых не добавляет', () => {
		mockGeometry();
		const roots: LazyDoc[] = Array.from({ length: 500 }, (_, i) => ({ id: i + 1, parent: null, title: `R${i + 1}`, kids: true }));
		const [loading, setLoading] = createSignal<ReadonlySet<RowKey>>(new Set());
		const loadChildren = vi.fn((batchRows: readonly LazyDoc[]) => {
			setLoading((current) => new Set([...current, ...batchRows.map((row) => row.id)]));
		});
		render(() => (
			<TreeList
				rows={roots}
				getRowKey={(row: LazyDoc) => row.id}
				getParentKey={(row: LazyDoc) => row.parent}
				hasChildren={(row: LazyDoc) => row.kids}
				loadChildren={loadChildren}
				loadingKeys={loading()}
				columns={LAZY_COLUMNS}
				rowHeight={20}
				overscan={2}
				aria-label='Документы'
			/>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Развернуть уровень' }));
		expect(loadChildren).toHaveBeenCalledTimes(1);
		expect(loadChildren.mock.calls[0]?.[0]).toHaveLength(500);
		const scroller = screen.getByRole('treegrid').parentElement as HTMLElement;
		const indexes = (): number[] => {
			return [...document.querySelectorAll('tbody > tr[data-index]')].map((tr) => Number(tr.getAttribute('data-index')));
		};
		const top = indexes();
		expect(top.length).toBeGreaterThan(0);
		expect(top.length).toBeLessThan(40);
		scroller.scrollTop = 4000;
		scroller.dispatchEvent(new Event('scroll'));
		// окно действительно сместилось: строки смонтированы заново, а новых запросов нет
		expect(Math.min(...indexes())).toBeGreaterThan(Math.max(...top));
		expect(loadChildren).toHaveBeenCalledTimes(1);
		scroller.scrollTop = 0;
		scroller.dispatchEvent(new Event('scroll'));
		expect(indexes()).toEqual(top);
		expect(loadChildren).toHaveBeenCalledTimes(1);
	});
});
