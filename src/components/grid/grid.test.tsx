import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { installListGeometry } from '../../internal/testing/list-geometry';
import { ContextMenu } from '../context-menu';
import { Select } from '../select';

import { Grid } from './grid';
import type { GridColumn } from './grid-column';
import type { GridGroup } from './grid-group';
import type { GridSort } from './grid-sort';

afterEach(cleanup);

interface Person {
	id: number;
	name: string;
	age: number;
	note: string | null;
}

const ROWS: readonly Person[] = [
	{ id: 1, name: 'Анна', age: 31, note: null },
	{ id: 2, name: 'Борис', age: 0, note: 'в отпуске' },
	{ id: 3, name: 'Вера', age: 45, note: '' }
];

// порядок показа: name и id закреплены и идут первыми, secret скрыта, age и note обычные
const COLUMNS: readonly GridColumn<Person>[] = [
	{ id: 'age', title: 'Возраст', value: (row) => row.age, width: 100, align: 'end' },
	{ id: 'name', title: 'Имя', value: (row) => row.name, width: 150, locked: true },
	{ id: 'secret', title: 'Секрет', value: () => 'скрыто', hidden: true },
	{ id: 'id', title: 'Номер', value: (row) => row.id, width: 80, locked: true },
	{ id: 'note', title: 'Заметка', value: (row) => row.note, cell: (row) => <b data-note>{row.note ?? '—'}</b> }
];

function renderGrid(overrides: Partial<Parameters<typeof Grid<Person>>[0]> = {}) {
	return render(() => (
		<Grid
			rows={ROWS}
			getRowKey={(row) => row.id}
			columns={COLUMNS}
			virtualized={false}
			aria-label='Люди'
			{...overrides}
		/>
	));
}

function table(): HTMLTableElement {
	return screen.getByRole<HTMLTableElement>('table', { name: 'Люди' });
}

function bodyRows(): HTMLTableRowElement[] {
	return [...table().querySelectorAll<HTMLTableRowElement>('tbody > tr[data-index]')];
}

describe('Grid: корпус', () => {
	it('корень имеет атрибуты kit и служит якорем фокуса, таблица названа через aria-label', () => {
		const { container } = renderGrid();
		const root = container.firstElementChild;
		expect(root?.hasAttribute('data-s-kit')).toBe(true);
		expect(root?.hasAttribute('data-s-kit-focus-inset')).toBe(true);
		expect(root?.getAttribute('tabindex')).toBe('-1');
		expect(table().closest('[data-s-kit]')).toBe(root);
	});

	it('class и style попадают на корень', () => {
		const { container } = renderGrid({ class: 'extra', style: { '--page-token': '1' } });
		const root = container.firstElementChild as HTMLElement;
		expect(root.classList.contains('extra')).toBe(true);
		expect(root.style.getPropertyValue('--page-token')).toBe('1');
	});

	it('rowHeight ложится в переменную высоты строки', () => {
		const { container } = renderGrid({ rowHeight: 44 });
		expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--s-kit-grid-row-height')).toBe('44px');
	});
});

describe('Grid: колонки', () => {
	it('число col равно числу видимых колонок, у последней нет ширины, у остальных переменная', () => {
		renderGrid();
		const cols = [...table().querySelectorAll<HTMLTableColElement>('colgroup > col')];
		expect(cols).toHaveLength(4);
		expect(cols.map((col) => col.style.width)).toEqual([
			'var(--s-kit-grid-w-0)',
			'var(--s-kit-grid-w-1)',
			'var(--s-kit-grid-w-2)',
			''
		]);
	});

	it('на таблице стоят переменные ширин, суммы и смещения только закреплённых', () => {
		renderGrid();
		const style = table().style;
		expect(style.getPropertyValue('--s-kit-grid-w-0')).toBe('150px');
		expect(style.getPropertyValue('--s-kit-grid-w-1')).toBe('80px');
		expect(style.getPropertyValue('--s-kit-grid-w-2')).toBe('100px');
		expect(style.getPropertyValue('--s-kit-grid-w-3')).toBe('160px');
		expect(style.getPropertyValue('--s-kit-grid-table-w')).toBe('490px');
		expect(style.getPropertyValue('--s-kit-grid-left-0')).toBe('0px');
		expect(style.getPropertyValue('--s-kit-grid-left-1')).toBe('150px');
		expect(style.getPropertyValue('--s-kit-grid-left-2')).toBe('');
		expect(style.getPropertyValue('--s-kit-grid-left-3')).toBe('');
	});

	it('заголовки идут в порядке «закреплённые первыми», скрытая колонка не рендерится', () => {
		renderGrid();
		const titles = [...table().querySelectorAll('thead th')].map((th) => th.textContent);
		expect(titles).toEqual(['Имя', 'Номер', 'Возраст', 'Заметка']);
	});

	it('ширина из columnWidths попадает в переменную и в сумму, но не меньше minWidth', () => {
		renderGrid({ columnWidths: { age: 240, name: 10 } });
		const style = table().style;
		expect(style.getPropertyValue('--s-kit-grid-w-2')).toBe('240px');
		expect(style.getPropertyValue('--s-kit-grid-w-0')).toBe('60px');
	});

	it('закреплённые ячейки имеют data-sticky и смещение, последняя data-sticky-last', () => {
		renderGrid();
		const cells = [...(bodyRows()[0] as HTMLTableRowElement).cells];
		expect(cells.map((cell) => cell.hasAttribute('data-sticky'))).toEqual([true, true, false, false]);
		expect(cells.map((cell) => cell.hasAttribute('data-sticky-last'))).toEqual([false, true, false, false]);
		expect(cells[0]?.style.insetInlineStart).toBe('var(--s-kit-grid-left-0)');
		expect(cells[1]?.style.insetInlineStart).toBe('var(--s-kit-grid-left-1)');
		expect(cells[2]?.style.insetInlineStart).toBe('');
		const headers = [...table().querySelectorAll('thead th')];
		expect(headers.map((th) => th.hasAttribute('data-sticky'))).toEqual([true, true, false, false]);
		expect(headers[1]?.hasAttribute('data-sticky-last')).toBe(true);
	});

	it('без закреплённых колонок data-sticky-last нет нигде', () => {
		renderGrid({ columns: COLUMNS.map((column) => ({ ...column, locked: false })) });
		expect(table().querySelector('[data-sticky], [data-sticky-last]')).toBeNull();
	});

	it('align колонки попадает в атрибут ячейки и заголовка', () => {
		renderGrid();
		expect((bodyRows()[0] as HTMLTableRowElement).cells[2]?.getAttribute('data-align')).toBe('end');
		expect(table().querySelectorAll('thead th')[2]?.getAttribute('data-align')).toBe('end');
	});
});

describe('Grid: строки', () => {
	it('ячейка показывает значение через formatCellValue или результат cell', () => {
		renderGrid();
		const first = (bodyRows()[0] as HTMLTableRowElement).cells;
		expect([...first].map((cell) => cell.textContent)).toEqual(['Анна', '1', '31', '—']);
		expect(first[3]?.querySelector('[data-note]')?.textContent).toBe('—');
	});

	it('0 остаётся нулём, пустое значение пустой ячейкой, у текстовой ячейки есть title', () => {
		renderGrid({
			columns: [
				{ id: 'age', title: 'Возраст', value: (row) => row.age },
				{ id: 'note', title: 'Заметка', value: (row) => row.note }
			]
		});
		const second = (bodyRows()[1] as HTMLTableRowElement).cells;
		expect(second[0]?.textContent).toBe('0');
		expect(second[0]?.getAttribute('title')).toBe('0');
		const first = (bodyRows()[0] as HTMLTableRowElement).cells;
		expect(first[1]?.textContent).toBe('');
	});

	it('строка имеет data-index, data-row-key и aria-rowindex, таблица aria-rowcount', () => {
		renderGrid();
		expect(table().getAttribute('aria-rowcount')).toBe('4');
		expect(table().getAttribute('aria-colcount')).toBe('4');
		expect(table().querySelector('thead tr')?.getAttribute('aria-rowindex')).toBe('1');
		const rows = bodyRows();
		expect(rows.map((row) => row.dataset['index'])).toEqual(['0', '1', '2']);
		expect(rows.map((row) => row.dataset['rowKey'])).toEqual(['1', '2', '3']);
		expect(rows.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3', '4']);
	});

	it('при virtualized={false} spacer-строк нет', () => {
		renderGrid();
		expect(table().querySelector('tbody > tr[aria-hidden="true"]')).toBeNull();
	});

	it('смена rows обновляет тело', () => {
		const [rows, setRows] = createSignal<readonly Person[]>(ROWS);
		render(() => <Grid rows={rows()} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} aria-label='Люди'/>);
		expect(bodyRows()).toHaveLength(3);
		setRows([{ id: 9, name: 'Глеб', age: 20, note: null }]);
		expect(bodyRows()).toHaveLength(1);
		expect((bodyRows()[0] as HTMLTableRowElement).cells[0]?.textContent).toBe('Глеб');
		expect(bodyRows()[0]?.dataset['rowKey']).toBe('9');
	});

	it('смена ширин не пересоздаёт строки и не вызывает value и cell повторно', () => {
		const value = vi.fn((row: Person) => row.name);
		const cell = vi.fn((row: Person) => <i>{row.age}</i>);
		const columns: GridColumn<Person>[] = [
			{ id: 'name', title: 'Имя', value },
			{ id: 'age', title: 'Возраст', value: (row) => row.age, cell }
		];
		const [widths, setWidths] = createSignal<Readonly<Record<string, number>>>({});
		render(() => (
			<Grid rows={ROWS} getRowKey={(row) => row.id} columns={columns} columnWidths={widths()} virtualized={false} aria-label='Люди'/>
		));
		const rowBefore = bodyRows()[0];
		const valueCalls = value.mock.calls.length;
		const cellCalls = cell.mock.calls.length;
		setWidths({ name: 300 });
		expect(table().style.getPropertyValue('--s-kit-grid-w-0')).toBe('300px');
		expect(bodyRows()[0]).toBe(rowBefore);
		expect(value.mock.calls.length).toBe(valueCalls);
		expect(cell.mock.calls.length).toBe(cellCalls);
	});
});

// В jsdom нет раскладки: высоту окна виртуализатору даёт clientHeight скроллера, высоту строки offsetHeight строки.
function mockGeometry(options: { windowHeight: number; rowHeight: number; headerHeight?: number }): void {
	vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(options.windowHeight);
	vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(400);
	vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function offsetHeight(this: HTMLElement) {
		if (this.tagName === 'TR') {
			return options.rowHeight;
		}
		return this.tagName === 'THEAD' ? (options.headerHeight ?? 0) : 0;
	});
}

function manyRows(count: number): Person[] {
	return Array.from({ length: count }, (_, index) => ({ id: index, name: `Имя ${index}`, age: index, note: null }));
}

function spacerHeights(): number[] {
	const cells = table().querySelectorAll<HTMLTableCellElement>('tbody > tr[aria-hidden="true"] > td');
	return [...cells].map((cell) => parseFloat(cell.style.height));
}

describe('Grid: виртуализация', () => {
	it('рендерит окно плюс overscan между двумя spacer-строками, сумма высот равна totalSize', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20 });
		renderGrid({ rows: manyRows(1000), virtualized: true, rowHeight: 20, overscan: 2 });
		const rows = bodyRows();
		expect(rows.length).toBeGreaterThanOrEqual(5);
		expect(rows.length).toBeLessThanOrEqual(5 + 2 * 2);
		const spacers = table().querySelectorAll('tbody > tr[aria-hidden="true"]');
		expect(spacers).toHaveLength(1);
		expect(spacers[0]?.getAttribute('role')).toBe('presentation');
		expect(spacers[0]?.querySelector('td')?.getAttribute('colspan')).toBe('4');
		const [bottom] = spacerHeights();
		expect((bottom ?? 0) + rows.length * 20).toBe(1000 * 20);
	});

	it('rowHeight колонки поднимает оценку высоты строки и попадает в переменную ячейки', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 50 });
		renderGrid({
			rows: manyRows(1000),
			virtualized: true,
			rowHeight: 20,
			overscan: 2,
			columns: COLUMNS.map((column) => (column.id === 'age' ? { ...column, rowHeight: 50 } : column))
		});
		const rows = bodyRows();
		const [bottom] = spacerHeights();
		expect((bottom ?? 0) + rows.length * 50).toBe(1000 * 50);
		const cells = rows[0]?.querySelectorAll('td') ?? [];
		expect([...cells].map((cell) => cell.style.getPropertyValue('--s-kit-grid-cell-h'))).toEqual(['', '', '50px', '']);
	});

	it('измеряются все строки окна: к моменту измерения у строки уже есть data-index', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20 });
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderGrid({ rows: manyRows(1000), virtualized: true, rowHeight: 20, overscan: 2 });
		expect(bodyRows().length).toBeGreaterThan(0);
		expect(warn).not.toHaveBeenCalled();
	});

	it('после прокрутки есть оба spacer, а первая строка окна учитывает высоту шапки (scrollMargin)', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20, headerHeight: 36 });
		renderGrid({ rows: manyRows(1000), virtualized: true, rowHeight: 20, overscan: 2 });
		const scroller = table().parentElement as HTMLElement;
		scroller.scrollTop = 2000;
		scroller.dispatchEvent(new Event('scroll'));
		const rows = bodyRows();
		const first = Number(rows[0]?.dataset['index']);
		// первая видимая строка: 36 + 20k > 2000 даёт k = 98, минус overscan 2
		expect(first).toBe(96);
		const [top, bottom] = spacerHeights();
		expect(top).toBe(96 * 20);
		expect((top ?? 0) + rows.length * 20 + (bottom ?? 0)).toBe(1000 * 20);
	});

	it('смена rows меняет число строк, при малом числе spacer нет', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20 });
		const [rows, setRows] = createSignal<readonly Person[]>(manyRows(1000));
		render(() => (
			<Grid rows={rows()} getRowKey={(row) => row.id} columns={COLUMNS} rowHeight={20} overscan={2} aria-label='Люди'/>
		));
		expect(table().querySelector('tbody > tr[aria-hidden="true"]')).not.toBeNull();
		setRows(manyRows(3));
		expect(bodyRows()).toHaveLength(3);
		expect(table().querySelector('tbody > tr[aria-hidden="true"]')).toBeNull();
	});

	it('scroll-padding скроллера равен высоте шапки и ширине закреплённых колонок', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20, headerHeight: 36 });
		renderGrid({ rows: manyRows(10), virtualized: true, rowHeight: 20 });
		const scroller = table().parentElement as HTMLElement;
		expect(scroller.style.getPropertyValue('scroll-padding-block-start')).toBe('36px');
		expect(scroller.style.getPropertyValue('scroll-padding-inline-start')).toBe('230px');
	});

	it('virtualized по умолчанию включён: тысяча строк не попадает в DOM целиком', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20 });
		render(() => <Grid rows={manyRows(1000)} getRowKey={(row) => row.id} columns={COLUMNS} rowHeight={20} aria-label='Люди'/>);
		expect(bodyRows().length).toBeLessThan(40);
	});
});

function pointer(type: string, clientX: number): MouseEvent {
	const event = new MouseEvent(type, { bubbles: true, clientX, button: 0 });
	Object.defineProperty(event, 'pointerId', { value: 1 });
	return event;
}

function handleOf(title: string): HTMLElement {
	const header = [...table().querySelectorAll('thead th')].find((th) => th.textContent === title);
	return header?.querySelector<HTMLElement>('[data-grid-resize]') as HTMLElement;
}

function tableVar(name: string): string {
	return table().style.getPropertyValue(name);
}

describe('Grid: ресайз колонок', () => {
	it('в каждом заголовке есть ручка-разделитель вне Tab-порядка', () => {
		renderGrid();
		const handles = table().querySelectorAll('thead th [data-grid-resize]');
		expect(handles).toHaveLength(4);
		expect(handles[0]?.getAttribute('role')).toBe('separator');
		expect(handles[0]?.getAttribute('aria-orientation')).toBe('vertical');
		expect(handles[0]?.hasAttribute('tabindex')).toBe(false);
	});

	it('серия pointermove меняет только переменные: ни value, ни cell, ни onColumnWidthsChange, строки те же', () => {
		const value = vi.fn((row: Person) => row.age);
		const cell = vi.fn((row: Person) => <i>{row.name}</i>);
		const onChange = vi.fn();
		const columns: GridColumn<Person>[] = [
			{ id: 'name', title: 'Имя', value: (row) => row.name, width: 150, locked: true },
			{ id: 'age', title: 'Возраст', value, width: 100 },
			{ id: 'city', title: 'Город', value: () => '', cell, width: 120 }
		];
		renderGrid({ columns, onColumnWidthsChange: onChange });
		const rowsBefore = bodyRows();
		const valueCalls = value.mock.calls.length;
		const cellCalls = cell.mock.calls.length;
		const handle = handleOf('Возраст');
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointermove', 120));
		expect(tableVar('--s-kit-grid-w-1')).toBe('120px');
		expect(tableVar('--s-kit-grid-table-w')).toBe('390px');
		handle.dispatchEvent(pointer('pointermove', 150));
		handle.dispatchEvent(pointer('pointermove', 90));
		expect(tableVar('--s-kit-grid-w-1')).toBe('90px');
		expect(tableVar('--s-kit-grid-table-w')).toBe('360px');
		expect(value.mock.calls.length).toBe(valueCalls);
		expect(cell.mock.calls.length).toBe(cellCalls);
		expect(onChange).not.toHaveBeenCalled();
		bodyRows().forEach((row, index) => {
			expect(row).toBe(rowsBefore[index]);
		});
	});

	it('pointerup вызывает onColumnWidthsChange ровно один раз с полным словарём и оставляет ширину', () => {
		const onChange = vi.fn();
		renderGrid({ defaultColumnWidths: { name: 200 }, onColumnWidthsChange: onChange });
		const handle = handleOf('Возраст');
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointermove', 140));
		handle.dispatchEvent(pointer('pointerup', 140));
		handle.dispatchEvent(pointer('pointerup', 300));
		expect(onChange).toHaveBeenCalledExactlyOnceWith({ name: 200, age: 140 });
		expect(tableVar('--s-kit-grid-w-2')).toBe('140px');
	});

	it('нажатие без движения не сообщает о ширине', () => {
		const onChange = vi.fn();
		renderGrid({ onColumnWidthsChange: onChange });
		const handle = handleOf('Возраст');
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointerup', 100));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('Esc возвращает прежние переменные, колбэк не зовётся', () => {
		const onChange = vi.fn();
		renderGrid({ onColumnWidthsChange: onChange });
		const handle = handleOf('Возраст');
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointermove', 180));
		expect(tableVar('--s-kit-grid-w-2')).toBe('180px');
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(tableVar('--s-kit-grid-w-2')).toBe('100px');
		expect(tableVar('--s-kit-grid-table-w')).toBe('490px');
		handle.dispatchEvent(pointer('pointerup', 180));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('ширина зажимается по minWidth колонки', () => {
		renderGrid({ columns: COLUMNS.map((column) => (column.id === 'age' ? { ...column, minWidth: 90 } : column)) });
		const handle = handleOf('Возраст');
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointermove', -500));
		expect(tableVar('--s-kit-grid-w-2')).toBe('90px');
		handle.dispatchEvent(pointer('pointerup', -500));
	});

	it('ресайз закреплённой колонки сдвигает смещения закреплённых правее и scroll-padding', () => {
		renderGrid();
		const handle = handleOf('Имя');
		handle.dispatchEvent(pointer('pointerdown', 150));
		handle.dispatchEvent(pointer('pointermove', 180));
		expect(tableVar('--s-kit-grid-w-0')).toBe('180px');
		expect(tableVar('--s-kit-grid-left-1')).toBe('180px');
		expect((table().parentElement as HTMLElement).style.getPropertyValue('scroll-padding-inline-start')).toBe('260px');
		handle.dispatchEvent(pointer('pointerup', 180));
	});

	it('двойной клик по ручке убирает ширину колонки из словаря и возвращает исходную', () => {
		const onChange = vi.fn();
		renderGrid({ defaultColumnWidths: { age: 200, name: 170 }, onColumnWidthsChange: onChange });
		expect(tableVar('--s-kit-grid-w-2')).toBe('200px');
		handleOf('Возраст').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
		expect(tableVar('--s-kit-grid-w-2')).toBe('100px');
		expect(onChange).toHaveBeenCalledExactlyOnceWith({ name: 170 });
	});

	it('двойной клик по колонке без переопределения ничего не сообщает', () => {
		const onChange = vi.fn();
		renderGrid({ onColumnWidthsChange: onChange });
		handleOf('Возраст').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('controlled: если родитель не принял ширину, после pointerup возвращается значение из пропа', () => {
		const onChange = vi.fn();
		renderGrid({ columnWidths: { age: 100 }, onColumnWidthsChange: onChange });
		const handle = handleOf('Возраст');
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointermove', 150));
		expect(tableVar('--s-kit-grid-w-2')).toBe('150px');
		handle.dispatchEvent(pointer('pointerup', 150));
		expect(onChange).toHaveBeenCalledExactlyOnceWith({ age: 150 });
		expect(tableVar('--s-kit-grid-w-2')).toBe('100px');
	});

	it('controlled: принятая родителем ширина остаётся', () => {
		const [widths, setWidths] = createSignal<Readonly<Record<string, number>>>({ age: 100 });
		let accepted: Readonly<Record<string, number>> | undefined;
		render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				columnWidths={widths()}
				onColumnWidthsChange={(next) => {
					accepted = next;
					setWidths(next);
				}}
				virtualized={false}
				aria-label='Люди'
			/>
		));
		const handle = handleOf('Возраст');
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointermove', 150));
		handle.dispatchEvent(pointer('pointerup', 150));
		expect(accepted).toEqual({ age: 150 });
		expect(tableVar('--s-kit-grid-w-2')).toBe('150px');
	});
});

describe('Grid: колонка чекбоксов', () => {
	function selectableGrid(overrides: Partial<Parameters<typeof Grid<Person>>[0]> = {}) {
		return renderGrid({ selectable: true, ...overrides });
	}

	it('первая col принадлежит колонке чекбоксов, переменные учитывают её ширину', () => {
		selectableGrid();
		const cols = [...table().querySelectorAll<HTMLTableColElement>('colgroup > col')];
		expect(cols).toHaveLength(5);
		expect(cols[0]?.style.width).toBe('var(--s-kit-grid-select-w)');
		expect(cols[1]?.style.width).toBe('var(--s-kit-grid-w-0)');
		expect(tableVar('--s-kit-grid-select-w')).toBe('44px');
		expect(tableVar('--s-kit-grid-table-w')).toBe('534px');
		expect(tableVar('--s-kit-grid-left-0')).toBe('44px');
		expect(tableVar('--s-kit-grid-left-1')).toBe('194px');
		expect(table().getAttribute('aria-colcount')).toBe('5');
	});

	it('первая th и первая td строки закреплены у левого края, data-sticky-last у последней закреплённой колонки', () => {
		selectableGrid();
		const header = table().querySelector('thead th') as HTMLElement;
		const cells = (bodyRows()[0] as HTMLTableRowElement).cells;
		for (const cell of [header, cells[0] as HTMLElement]) {
			expect(cell.hasAttribute('data-sticky')).toBe(true);
			expect(cell.hasAttribute('data-grid-select')).toBe(true);
			expect(cell.style.insetInlineStart).toBe('0px');
			expect(cell.hasAttribute('data-sticky-last')).toBe(false);
		}
		expect(cells[2]?.hasAttribute('data-sticky-last')).toBe(true);
	});

	it('без закреплённых колонок data-sticky-last у колонки чекбоксов', () => {
		selectableGrid({ columns: COLUMNS.map((column) => ({ ...column, locked: false })) });
		const cells = (bodyRows()[0] as HTMLTableRowElement).cells;
		expect(cells[0]?.hasAttribute('data-sticky-last')).toBe(true);
		expect(table().querySelector('thead th')?.hasAttribute('data-sticky-last')).toBe(true);
		expect(cells[1]?.hasAttribute('data-sticky-last')).toBe(false);
	});

	it('число ячеек строки и заголовков больше на единицу, spacer охватывает и колонку чекбоксов', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20 });
		selectableGrid({ rows: manyRows(1000), virtualized: true, rowHeight: 20, overscan: 2 });
		expect(table().querySelectorAll('thead th')).toHaveLength(5);
		expect((bodyRows()[0] as HTMLTableRowElement).cells).toHaveLength(5);
		expect(table().querySelector('tbody > tr[aria-hidden="true"] > td')?.getAttribute('colspan')).toBe('5');
	});

	it('без selectable колонки чекбоксов нет', () => {
		renderGrid();
		expect(table().querySelector('[data-grid-select]')).toBeNull();
		expect(table().style.getPropertyValue('--s-kit-grid-select-w')).toBe('');
	});

	it('ресайз закреплённой колонки двигает смещения от ширины колонки чекбоксов', () => {
		selectableGrid();
		const handle = handleOf('Имя');
		handle.dispatchEvent(pointer('pointerdown', 150));
		handle.dispatchEvent(pointer('pointermove', 180));
		expect(tableVar('--s-kit-grid-left-1')).toBe('224px');
		expect((table().parentElement as HTMLElement).style.getPropertyValue('scroll-padding-inline-start')).toBe('304px');
		handle.dispatchEvent(pointer('pointerup', 180));
	});
});

function rowBoxes(): HTMLInputElement[] {
	return screen.getAllByRole<HTMLInputElement>('checkbox', { name: 'Выбрать строку' });
}

function allBox(): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('checkbox', { name: 'Выбрать все строки' });
}

describe('Grid: выбор строк', () => {
	it('у чекбоксов строк и главного есть имена по умолчанию, свои подписи заменяют их', () => {
		renderGrid({ selectable: true });
		expect(rowBoxes()).toHaveLength(3);
		expect(allBox()).toBeTruthy();
		cleanup();
		renderGrid({ selectable: true, selectAllLabel: 'Все', selectRowLabel: 'Строка' });
		expect(screen.getByRole('checkbox', { name: 'Все' })).toBeTruthy();
		expect(screen.getAllByRole('checkbox', { name: 'Строка' })).toHaveLength(3);
	});

	it('клик по чекбоксу строки сообщает новый Set, не меняя прежний, строка получает data-selected и aria-selected', () => {
		const initial = new Set<number>();
		const onChange = vi.fn();
		renderGrid({ selectable: true, defaultSelectedKeys: initial, onSelectedKeysChange: onChange });
		fireEvent.click(rowBoxes()[1] as HTMLElement);
		expect(onChange).toHaveBeenCalledTimes(1);
		const next = onChange.mock.calls[0]?.[0] as ReadonlySet<number>;
		expect([...next]).toEqual([2]);
		expect(next).not.toBe(initial);
		expect(initial.size).toBe(0);
		expect(bodyRows()[1]?.hasAttribute('data-selected')).toBe(true);
		expect(bodyRows()[1]?.getAttribute('aria-selected')).toBe('true');
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(false);
		expect(bodyRows()[0]?.hasAttribute('aria-selected')).toBe(false);
		fireEvent.click(rowBoxes()[1] as HTMLElement);
		expect(bodyRows()[1]?.hasAttribute('data-selected')).toBe(false);
	});

	it('главный чекбокс отражает none, some, all', () => {
		renderGrid({ selectable: true, defaultSelectedKeys: new Set([1]) });
		expect(allBox().checked).toBe(false);
		expect(allBox().indeterminate).toBe(true);
		fireEvent.click(rowBoxes()[1] as HTMLElement);
		fireEvent.click(rowBoxes()[2] as HTMLElement);
		expect(allBox().checked).toBe(true);
		expect(allBox().indeterminate).toBe(false);
		fireEvent.click(allBox());
		expect(allBox().checked).toBe(false);
		expect(allBox().indeterminate).toBe(false);
		expect(rowBoxes().every((box) => !box.checked)).toBe(true);
	});

	it('главный чекбокс при частичном выборе выбирает все, при полном убирает только ключи загрузки', () => {
		const onChange = vi.fn();
		renderGrid({ selectable: true, defaultSelectedKeys: new Set([1, 999]), onSelectedKeysChange: onChange });
		fireEvent.click(allBox());
		expect([...(onChange.mock.calls[0]?.[0] as ReadonlySet<number>)].sort((a, b) => a - b)).toEqual([1, 2, 3, 999]);
		fireEvent.click(allBox());
		expect([...(onChange.mock.calls[1]?.[0] as ReadonlySet<number>)]).toEqual([999]);
		expect(allBox().checked).toBe(false);
	});

	it('controlled: если родитель не принял выбор, чекбокс остаётся прежним', () => {
		const onChange = vi.fn();
		renderGrid({ selectable: true, selectedKeys: new Set<number>(), onSelectedKeysChange: onChange });
		fireEvent.click(rowBoxes()[0] as HTMLElement);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(rowBoxes()[0]?.checked).toBe(false);
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(false);
	});

	it('controlled: принятый родителем выбор отображается', () => {
		const [keys, setKeys] = createSignal<ReadonlySet<number>>(new Set());
		render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				selectable
				selectedKeys={keys()}
				onSelectedKeysChange={setKeys}
				virtualized={false}
				aria-label='Люди'
			/>
		));
		fireEvent.click(rowBoxes()[2] as HTMLElement);
		expect(rowBoxes()[2]?.checked).toBe(true);
		expect(bodyRows()[2]?.getAttribute('aria-selected')).toBe('true');
	});

	it('выбор сохраняется при замене rows, ключи отсутствующих строк не теряются', () => {
		const [rows, setRows] = createSignal<readonly Person[]>(ROWS);
		const onChange = vi.fn();
		render(() => (
			<Grid
				rows={rows()}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				selectable
				defaultSelectedKeys={new Set([1])}
				onSelectedKeysChange={onChange}
				virtualized={false}
				aria-label='Люди'
			/>
		));
		setRows([{ id: 5, name: 'Глеб', age: 20, note: null }]);
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(false);
		expect(allBox().checked).toBe(false);
		fireEvent.click(allBox());
		expect([...(onChange.mock.calls[0]?.[0] as ReadonlySet<number>)].sort()).toEqual([1, 5]);
		setRows(ROWS);
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(true);
	});
});

describe('Grid: клики по строке', () => {
	const CONTROL_COLUMNS: readonly GridColumn<Person>[] = [
		{ id: 'name', title: 'Имя', value: (row) => row.name },
		{
			id: 'controls',
			title: 'Контролы',
			value: () => '',
			cell: () => (
				<>
					<button type='button' data-t='button'>Кнопка</button>
					<a href='#x' data-t='link'>Ссылка</a>
					<input data-t='input'/>
					<select data-t='select'><option>1</option></select>
					<span role='combobox' aria-expanded='false' aria-controls='x' tabindex='0' data-t='combobox'>Выбор</span>
					<label data-t='label'>Подпись</label>
					<span data-grid-no-select data-t='no-select'>Свой клик</span>
				</>
			)
		}
	];

	function clickable(overrides: Partial<Parameters<typeof Grid<Person>>[0]> = {}) {
		return renderGrid({ selectable: true, columns: CONTROL_COLUMNS, ...overrides });
	}

	function firstRowTarget(name: string): HTMLElement {
		return (bodyRows()[0] as HTMLTableRowElement).querySelector(`[data-t="${name}"]`) as HTMLElement;
	}

	it('клик по тексту ячейки переключает выбор, второй клик снимает', () => {
		const onChange = vi.fn();
		clickable({ onSelectedKeysChange: onChange });
		const cell = (bodyRows()[0] as HTMLTableRowElement).cells[1] as HTMLElement;
		fireEvent.click(cell);
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(true);
		fireEvent.click(cell);
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(false);
		expect(onChange).toHaveBeenCalledTimes(2);
	});

	it('клик по интерактивной цели внутри ячейки выбор не меняет', () => {
		const onChange = vi.fn();
		clickable({ onSelectedKeysChange: onChange });
		for (const name of ['button', 'link', 'input', 'select', 'combobox', 'label', 'no-select']) {
			fireEvent.click(firstRowTarget(name));
		}
		expect(onChange).not.toHaveBeenCalled();
	});

	it('клик по чекбоксу строки переключает ровно один раз', () => {
		const onChange = vi.fn();
		clickable({ onSelectedKeysChange: onChange });
		fireEvent.click(rowBoxes()[0] as HTMLElement);
		expect(onChange).toHaveBeenCalledTimes(1);
	});

	it('клик по spacer-строке ничего не выбирает', () => {
		mockGeometry({ windowHeight: 100, rowHeight: 20 });
		const onChange = vi.fn();
		renderGrid({
			selectable: true,
			rows: manyRows(1000),
			virtualized: true,
			rowHeight: 20,
			overscan: 2,
			onSelectedKeysChange: onChange
		});
		fireEvent.click(table().querySelector('tbody > tr[aria-hidden="true"] > td') as HTMLElement);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('без selectable клик по строке ничего не вызывает', () => {
		const onChange = vi.fn();
		clickable({ selectable: false, onSelectedKeysChange: onChange });
		fireEvent.click((bodyRows()[0] as HTMLTableRowElement).cells[0] as HTMLElement);
		expect(onChange).not.toHaveBeenCalled();
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(false);
	});

	it('dblclick по тексту зовёт onRowDoubleClick с объектом строки', () => {
		const onDouble = vi.fn();
		clickable({ onRowDoubleClick: onDouble });
		fireEvent.dblClick((bodyRows()[1] as HTMLTableRowElement).cells[1] as HTMLElement);
		expect(onDouble).toHaveBeenCalledExactlyOnceWith(ROWS[1]);
	});

	it('dblclick по интерактивной цели не зовёт onRowDoubleClick', () => {
		const onDouble = vi.fn();
		clickable({ onRowDoubleClick: onDouble });
		fireEvent.dblClick(firstRowTarget('button'));
		fireEvent.dblClick(firstRowTarget('no-select'));
		expect(onDouble).not.toHaveBeenCalled();
	});

	it('click, click, dblclick оставляют выбор прежним: колбэк выбора дважды, onRowDoubleClick один раз', () => {
		const onChange = vi.fn();
		const onDouble = vi.fn();
		clickable({ onSelectedKeysChange: onChange, onRowDoubleClick: onDouble });
		const cell = (bodyRows()[0] as HTMLTableRowElement).cells[1] as HTMLElement;
		fireEvent.click(cell);
		fireEvent.click(cell);
		fireEvent.dblClick(cell);
		expect(bodyRows()[0]?.hasAttribute('data-selected')).toBe(false);
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onDouble).toHaveBeenCalledTimes(1);
	});

	it('после замены rows клик переключает ключ новой строки с тем же индексом', () => {
		const [rows, setRows] = createSignal<readonly Person[]>(ROWS);
		const onChange = vi.fn();
		render(() => (
			<Grid
				rows={rows()}
				getRowKey={(row) => row.id}
				columns={CONTROL_COLUMNS}
				selectable
				onSelectedKeysChange={onChange}
				virtualized={false}
				aria-label='Люди'
			/>
		));
		setRows([{ id: 77, name: 'Новый', age: 1, note: null }]);
		fireEvent.click((bodyRows()[0] as HTMLTableRowElement).cells[1] as HTMLElement);
		expect([...(onChange.mock.calls[0]?.[0] as ReadonlySet<number>)]).toEqual([77]);
	});
});

describe('Grid: сортировка', () => {
	const SORT_COLUMNS: readonly GridColumn<Person>[] = [
		{ id: 'name', title: 'Имя', value: (row) => row.name, sortable: true },
		{ id: 'age', title: 'Возраст', value: (row) => row.age, sortable: true },
		{ id: 'note', title: 'Заметка', value: (row) => row.note }
	];

	function sortable(overrides: Partial<Parameters<typeof Grid<Person>>[0]> = {}) {
		return renderGrid({ columns: SORT_COLUMNS, ...overrides });
	}

	function header(title: string): HTMLElement {
		return [...table().querySelectorAll<HTMLElement>('thead th')].find((th) => th.textContent === title) as HTMLElement;
	}

	function sortButton(title: string): HTMLButtonElement {
		return header(title).querySelector('button') as HTMLButtonElement;
	}

	it('у несортируемой колонки нет кнопки и aria-sort, у сортируемой есть кнопка и aria-sort="none"', () => {
		sortable();
		expect(header('Заметка').querySelector('button:not([data-grid-column-menu])')).toBeNull();
		expect(header('Заметка').hasAttribute('aria-sort')).toBe(false);
		expect(sortButton('Имя').type).toBe('button');
		expect(header('Имя').getAttribute('aria-sort')).toBe('none');
		expect(screen.getByRole('button', { name: 'Имя' })).toBeTruthy();
	});

	it('клики идут по циклу asc, desc, null, смена колонки начинает с asc', () => {
		const onSort = vi.fn();
		sortable({ onSortChange: onSort });
		fireEvent.click(sortButton('Имя'));
		expect(onSort).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'asc' });
		expect(header('Имя').getAttribute('aria-sort')).toBe('ascending');
		expect(header('Возраст').getAttribute('aria-sort')).toBe('none');
		fireEvent.click(sortButton('Имя'));
		expect(onSort).toHaveBeenLastCalledWith({ columnId: 'name', direction: 'desc' });
		expect(header('Имя').getAttribute('aria-sort')).toBe('descending');
		fireEvent.click(sortButton('Имя'));
		expect(onSort).toHaveBeenLastCalledWith(null);
		expect(header('Имя').getAttribute('aria-sort')).toBe('none');
		fireEvent.click(sortButton('Имя'));
		fireEvent.click(sortButton('Возраст'));
		expect(onSort).toHaveBeenLastCalledWith({ columnId: 'age', direction: 'asc' });
		expect(header('Имя').getAttribute('aria-sort')).toBe('none');
	});

	it('defaultSort задаёт начальное состояние, активная кнопка помечена data-active', () => {
		sortable({ defaultSort: { columnId: 'age', direction: 'desc' } });
		expect(header('Возраст').getAttribute('aria-sort')).toBe('descending');
		expect(sortButton('Возраст').hasAttribute('data-active')).toBe(true);
		expect(sortButton('Имя').hasAttribute('data-active')).toBe(false);
	});

	it('controlled: если родитель не принял сортировку, атрибуты не меняются; принятая отображается', () => {
		const onSort = vi.fn();
		sortable({ sort: null, onSortChange: onSort });
		fireEvent.click(sortButton('Имя'));
		expect(onSort).toHaveBeenCalledTimes(1);
		expect(header('Имя').getAttribute('aria-sort')).toBe('none');
		cleanup();
		const [sort, setSort] = createSignal<GridSort | null>(null);
		render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={SORT_COLUMNS}
				sort={sort()}
				onSortChange={setSort}
				virtualized={false}
				aria-label='Люди'
			/>
		));
		fireEvent.click(sortButton('Имя'));
		expect(header('Имя').getAttribute('aria-sort')).toBe('ascending');
	});

	it('сортировка не меняет порядок строк, а текст заголовка остаётся названием колонки', () => {
		sortable();
		fireEvent.click(sortButton('Возраст'));
		expect(bodyRows().map((row) => row.dataset['rowKey'])).toEqual(['1', '2', '3']);
		expect(header('Возраст').textContent).toBe('Возраст');
	});
});

describe('Grid: контекстное меню строки', () => {
	beforeEach(() => {
		// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
		HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
			this.removeAttribute('popover');
		});
		HTMLElement.prototype.hidePopover = vi.fn();
	});

	function menuOf(row: Person) {
		return (
			<>
				<ContextMenu.Item>{`Открыть ${row.name}`}</ContextMenu.Item>
				<ContextMenu.Item closeOnSelect={false}>Оставить</ContextMenu.Item>
			</>
		);
	}

	function rowCheckbox(index: number): HTMLInputElement {
		return (bodyRows()[index] as HTMLTableRowElement).querySelector('input[type="checkbox"]') as HTMLInputElement;
	}

	function press(key: string, options: { shiftKey?: boolean } = {}, target: Element = document.activeElement ?? document.body): Event {
		const event = createEvent.keyDown(target, { key, ...options });
		fireEvent(target, event);
		return event;
	}

	it('без rowContextMenu правый клик не отменяется и меню нет', () => {
		renderGrid();
		const cell = (bodyRows()[0] as HTMLTableRowElement).cells[0] as HTMLElement;
		expect(fireEvent.contextMenu(cell)).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('правый клик по ячейке открывает меню для этой строки, содержимое вызывается лениво один раз', () => {
		const rowContextMenu = vi.fn(menuOf);
		renderGrid({ rowContextMenu });
		expect(rowContextMenu).not.toHaveBeenCalled();
		const cell = (bodyRows()[1] as HTMLTableRowElement).cells[0] as HTMLElement;
		expect(fireEvent.contextMenu(cell, { clientX: 30, clientY: 40 })).toBe(false);
		expect(screen.getByRole('menu')).toBeTruthy();
		expect(screen.getByRole('menuitem', { name: 'Открыть Борис' })).toBeTruthy();
		expect(rowContextMenu).toHaveBeenCalledTimes(1);
		expect(rowContextMenu).toHaveBeenCalledWith(ROWS[1]);
	});

	it('меню лежит в корне грида, а не внутри таблицы', () => {
		const { container } = renderGrid({ rowContextMenu: menuOf });
		fireEvent.contextMenu((bodyRows()[0] as HTMLTableRowElement).cells[0] as HTMLElement);
		const menu = screen.getByRole('menu');
		expect(menu.closest('table')).toBeNull();
		expect(container.firstElementChild?.contains(menu)).toBe(true);
	});

	it('правый клик по заголовку меню не открывает и не отменяется', () => {
		renderGrid({ rowContextMenu: menuOf });
		const head = table().querySelector('thead th') as HTMLElement;
		expect(fireEvent.contextMenu(head)).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('правый клик строку не выбирает', () => {
		const onSelectedKeysChange = vi.fn();
		renderGrid({ rowContextMenu: menuOf, selectable: true, onSelectedKeysChange });
		fireEvent.contextMenu((bodyRows()[0] as HTMLTableRowElement).cells[1] as HTMLElement);
		expect(onSelectedKeysChange).not.toHaveBeenCalled();
	});

	it('Shift+F10 и клавиша ContextMenu на чекбоксе строки открывают меню, фокус на первом пункте; F10 без Shift нет', () => {
		renderGrid({ rowContextMenu: menuOf, selectable: true });
		rowCheckbox(0).focus();
		expect(press('F10').defaultPrevented).toBe(false);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(press('F10', { shiftKey: true }).defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Открыть Анна' }));
		press('Escape');
		expect(screen.queryByRole('menu')).toBeNull();
		rowCheckbox(2).focus();
		press('ContextMenu');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Открыть Вера' }));
	});

	it('Esc закрывает меню, фокус возвращается на чекбокс строки', () => {
		renderGrid({ rowContextMenu: menuOf, selectable: true });
		rowCheckbox(1).focus();
		press('F10', { shiftKey: true });
		press('Escape');
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(rowCheckbox(1));
	});

	it('клик и двойной клик по пункту не выбирают строку и не вызывают onRowDoubleClick', () => {
		const onSelectedKeysChange = vi.fn();
		const onRowDoubleClick = vi.fn();
		renderGrid({ rowContextMenu: menuOf, selectable: true, onSelectedKeysChange, onRowDoubleClick });
		fireEvent.contextMenu((bodyRows()[0] as HTMLTableRowElement).cells[1] as HTMLElement);
		const item = screen.getByRole('menuitem', { name: 'Оставить' });
		fireEvent.click(item);
		fireEvent.dblClick(item);
		expect(onSelectedKeysChange).not.toHaveBeenCalled();
		expect(onRowDoubleClick).not.toHaveBeenCalled();
	});

	it('прокрутка скроллера закрывает меню', () => {
		renderGrid({ rowContextMenu: menuOf });
		fireEvent.contextMenu((bodyRows()[0] as HTMLTableRowElement).cells[0] as HTMLElement);
		expect(screen.getByRole('menu')).toBeTruthy();
		(table().parentElement as HTMLElement).dispatchEvent(new Event('scroll'));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('повторное открытие на другой строке показывает пункты этой строки', () => {
		renderGrid({ rowContextMenu: menuOf });
		fireEvent.contextMenu((bodyRows()[0] as HTMLTableRowElement).cells[0] as HTMLElement);
		press('Escape');
		fireEvent.contextMenu((bodyRows()[2] as HTMLTableRowElement).cells[0] as HTMLElement);
		expect(screen.getByRole('menuitem', { name: 'Открыть Вера' })).toBeTruthy();
		expect(screen.queryByRole('menuitem', { name: 'Открыть Анна' })).toBeNull();
	});

	it('если строка с инициатором исчезла, после закрытия фокус на корне грида', () => {
		const [rows, setRows] = createSignal(ROWS);
		const { container } = render(() => (
			<Grid
				rows={rows()}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				virtualized={false}
				selectable
				aria-label='Люди'
				rowContextMenu={menuOf}
			/>
		));
		rowCheckbox(2).focus();
		press('F10', { shiftKey: true });
		setRows(ROWS.slice(0, 1));
		press('Escape');
		expect(document.activeElement).toBe(container.firstElementChild);
	});
});

describe('Grid: панели из ячеек и фокус при уходе строки', () => {
	interface Status {
		id: number;
		label: string;
	}

	const STATUSES: readonly Status[] = [
		{ id: 1, label: 'Новый' },
		{ id: 2, label: 'В работе' }
	];

	const CELL_COLUMNS: readonly GridColumn<Person>[] = [
		{ id: 'name', title: 'Имя', value: (row) => row.name, width: 120 },
		{
			id: 'act',
			title: 'Действие',
			value: () => '',
			width: 120,
			cell: (row) => <button type='button' data-act>{row.name}</button>
		},
		{
			id: 'status',
			title: 'Статус',
			value: () => '',
			width: 160,
			cell: (row) => (
				<Select<Status>
					items={STATUSES}
					getKey={(status) => status.id}
					getLabel={(status) => status.label}
					aria-label={`Статус ${row.name}`}
				/>
			)
		}
	];

	beforeEach(() => {
		// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
		HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
			this.removeAttribute('popover');
		});
		HTMLElement.prototype.hidePopover = vi.fn();
		installListGeometry({ rowHeight: 20, viewportHeight: 100 });
		vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
	});

	function CellsGrid(props: Partial<Parameters<typeof Grid<Person>>[0]>) {
		return <Grid rows={ROWS} getRowKey={(row) => row.id} columns={CELL_COLUMNS} virtualized={false} aria-label='Люди' {...props}/>;
	}

	function renderCells(overrides: Partial<Parameters<typeof Grid<Person>>[0]> = {}) {
		return render(() => <CellsGrid {...overrides}/>);
	}

	function actionButton(index: number): HTMLButtonElement {
		return (bodyRows()[index] as HTMLTableRowElement).querySelector('button[data-act]') as HTMLButtonElement;
	}

	function statusSelect(index: number): HTMLElement {
		return screen.getByRole('combobox', { name: `Статус ${ROWS[index]?.name ?? ''}` });
	}

	it('список опций Select из ячейки лежит в корне грида, а не внутри таблицы', () => {
		const { container } = renderCells();
		fireEvent.click(statusSelect(0));
		const listbox = screen.getByRole('listbox');
		expect(listbox.closest('table')).toBeNull();
		expect(container.firstElementChild?.contains(listbox)).toBe(true);
	});

	it('клик и двойной клик по опции не выбирают строку и не вызывают onRowDoubleClick', () => {
		const onSelectedKeysChange = vi.fn();
		const onRowDoubleClick = vi.fn();
		renderCells({ selectable: true, onSelectedKeysChange, onRowDoubleClick });
		fireEvent.click(statusSelect(0));
		const option = screen.getByRole('option', { name: 'В работе' });
		fireEvent.dblClick(option);
		fireEvent.click(option);
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(onSelectedKeysChange).not.toHaveBeenCalled();
		expect(onRowDoubleClick).not.toHaveBeenCalled();
	});

	it('строка с сфокусированной кнопкой исчезла: после микрозадачи фокус на корне грида', async () => {
		const [rows, setRows] = createSignal(ROWS);
		const { container } = render(() => <CellsGrid rows={rows()}/>);
		actionButton(2).focus();
		setRows(ROWS.slice(0, 1));
		await Promise.resolve();
		expect(document.activeElement).toBe(container.firstElementChild);
	});

	it('Select открыт в исчезнувшей строке: список закрыт без ошибок, фокус на корне', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const [rows, setRows] = createSignal(ROWS);
		const { container } = render(() => <CellsGrid rows={rows()}/>);
		fireEvent.click(statusSelect(2));
		expect(screen.getByRole('listbox')).toBeTruthy();
		setRows(ROWS.slice(0, 1));
		await Promise.resolve();
		expect(screen.queryByRole('listbox')).toBeNull();
		expect(error).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(container.firstElementChild);
	});

	it('фокус в строке, которая осталась, не трогается', async () => {
		const [rows, setRows] = createSignal(ROWS);
		render(() => <CellsGrid rows={rows()}/>);
		actionButton(0).focus();
		setRows(ROWS.slice(0, 2));
		await Promise.resolve();
		expect(document.activeElement).toBe(actionButton(0));
	});

	it('размонтирование всего грида с фокусом внутри не падает', async () => {
		const { unmount } = renderCells();
		actionButton(1).focus();
		unmount();
		await Promise.resolve();
		expect(document.activeElement).toBe(document.body);
	});
});

describe('Grid: состояния', () => {
	function root(container: HTMLElement): HTMLElement {
		return container.firstElementChild as HTMLElement;
	}

	function live(container: HTMLElement): HTMLElement {
		return container.querySelector('[aria-live="polite"]') as HTMLElement;
	}

	it('заглушки закреплены так же, как строки: чекбокс и locked-колонки sticky со смещением', () => {
		renderGrid({ loading: true, selectable: true });
		const row = table().querySelector('tbody > tr') as HTMLTableRowElement;
		const sticky = [...row.cells].map((cell) => cell.hasAttribute('data-sticky'));
		// порядок: чекбокс, затем locked-колонки name и id, затем обычные age и note
		expect(sticky).toEqual([true, true, true, false, false]);
		expect(row.cells[0]?.style.insetInlineStart).toBe('0px');
		expect(row.cells[1]?.style.insetInlineStart).toBe('var(--s-kit-grid-left-0)');
		expect(row.cells[2]?.style.insetInlineStart).toBe('var(--s-kit-grid-left-1)');
		expect(row.cells[3]?.style.insetInlineStart).toBe('');
		expect(row.cells[2]?.hasAttribute('data-sticky-last')).toBe(true);
		expect(row.cells[1]?.hasAttribute('data-sticky-last')).toBe(false);
	});

	it('загрузка: вместо строк заглушки, progressbar с именем, aria-busy только на время загрузки', () => {
		const [loading, setLoading] = createSignal(true);
		const { container } = render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				virtualized={false}
				loading={loading()}
				loadingLabel='Идёт загрузка'
				selectable
				aria-label='Люди'
			/>
		));
		expect(bodyRows()).toHaveLength(0);
		const skeleton = table().querySelectorAll('tbody > tr');
		expect(skeleton).toHaveLength(5);
		expect([...skeleton].every((row) => row.getAttribute('aria-hidden') === 'true')).toBe(true);
		expect((skeleton[0] as HTMLTableRowElement).cells).toHaveLength(5);
		const bar = screen.getByRole('progressbar', { name: 'Идёт загрузка' });
		expect(bar.hasAttribute('aria-valuenow')).toBe(false);
		expect(root(container).getAttribute('aria-busy')).toBe('true');
		setLoading(false);
		expect(screen.queryByRole('progressbar')).toBeNull();
		expect(root(container).hasAttribute('aria-busy')).toBe(false);
		expect(bodyRows()).toHaveLength(3);
	});

	it('подпись progressbar по умолчанию «Загрузка»', () => {
		renderGrid({ loading: true });
		expect(screen.getByRole('progressbar', { name: 'Загрузка' })).toBeTruthy();
	});

	it('загрузка: главный чекбокс отключён, сортировка работает, ручка ресайза не реагирует', () => {
		const onSortChange = vi.fn();
		const columns: GridColumn<Person>[] = [
			{ id: 'name', title: 'Имя', value: (row) => row.name, width: 150, sortable: true },
			{ id: 'age', title: 'Возраст', value: (row) => row.age, width: 100 }
		];
		renderGrid({ loading: true, selectable: true, columns, onSortChange });
		expect((table().querySelector('thead input[type="checkbox"]') as HTMLInputElement).disabled).toBe(true);
		fireEvent.click(table().querySelector('thead th button') as HTMLElement);
		expect(onSortChange).toHaveBeenCalledTimes(1);
		const handle = handleOf('Возраст');
		expect(handle.hasAttribute('data-disabled')).toBe(true);
		handle.dispatchEvent(pointer('pointerdown', 100));
		handle.dispatchEvent(pointer('pointermove', 160));
		expect(tableVar('--s-kit-grid-w-1')).toBe('100px');
	});

	it('загрузка началась, пока фокус был в строке: после микрозадачи фокус на корне', async () => {
		const [loading, setLoading] = createSignal(false);
		const { container } = render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				virtualized={false}
				loading={loading()}
				selectable
				aria-label='Люди'
			/>
		));
		(bodyRows()[1]?.querySelector('input[type="checkbox"]') as HTMLInputElement).focus();
		setLoading(true);
		await Promise.resolve();
		expect(document.activeElement).toBe(root(container));
	});

	it('пусто: текст по умолчанию, подсказка, шапка на месте, кнопки нет без onEmptyReset', () => {
		renderGrid({ rows: [], emptyHint: <span data-hint>Измените фильтры</span> });
		expect(screen.getByText('Ничего не найдено')).toBeTruthy();
		expect(screen.getByText('Измените фильтры')).toBeTruthy();
		expect(screen.queryByRole('button', { name: 'Сбросить фильтры' })).toBeNull();
		expect(table().querySelectorAll('thead th').length).toBeGreaterThan(0);
		expect(bodyRows()).toHaveLength(0);
	});

	it('пусто: кнопка сброса есть только с onEmptyReset, подпись настраивается, клик зовёт колбэк один раз', () => {
		const onEmptyReset = vi.fn();
		renderGrid({ rows: [], onEmptyReset, emptyText: 'Нет людей' });
		expect(screen.getByText('Нет людей')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
		expect(onEmptyReset).toHaveBeenCalledTimes(1);
	});

	it('пусто: colspan блока учитывает колонку чекбоксов', () => {
		renderGrid({ rows: [], selectable: true });
		expect(table().querySelector('tbody td')?.getAttribute('colspan')).toBe('5');
	});

	it('при загрузке и пустых rows показываются заглушки, а не блок «пусто»', () => {
		renderGrid({ rows: [], loading: true });
		expect(screen.queryByText('Ничего не найдено')).toBeNull();
		expect(table().querySelectorAll('tbody > tr[aria-hidden="true"]')).toHaveLength(5);
	});

	it('live-область соседствует с корнем, в первый рендер пуста и не объявляет смену rows без смены loading', () => {
		const [rows, setRows] = createSignal(ROWS);
		const { container } = render(() => (
			<Grid rows={rows()} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} aria-label='Люди'/>
		));
		expect(live(container).textContent).toBe('');
		expect(root(container).contains(live(container))).toBe(false);
		setRows([]);
		expect(live(container).textContent).toBe('');
	});

	it('после окончания загрузки объявляется число записей, при начале загрузки область очищается', () => {
		const [loading, setLoading] = createSignal(true);
		const { container } = render(() => (
			<Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} loading={loading()} aria-label='Люди'/>
		));
		expect(live(container).textContent).toBe('');
		setLoading(false);
		expect(live(container).textContent).toBe('Найдено 3 записи');
		setLoading(true);
		expect(live(container).textContent).toBe('');
	});

	it('после загрузки с пустым результатом объявляется emptyText; foundText можно заменить', () => {
		const [loading, setLoading] = createSignal(true);
		const [rows, setRows] = createSignal<readonly Person[]>(ROWS);
		const { container } = render(() => (
			<Grid
				rows={rows()}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				virtualized={false}
				loading={loading()}
				foundText={(count) => `Всего: ${count}`}
				emptyText='Пусто'
				aria-label='Люди'
			/>
		));
		setLoading(false);
		expect(live(container).textContent).toBe('Всего: 3');
		setLoading(true);
		setRows([]);
		setLoading(false);
		expect(live(container).textContent).toBe('Пусто');
	});
});

describe('Grid: пейджер', () => {
	function footer(): HTMLElement | null {
		return document.querySelector<HTMLElement>('nav[aria-label="Постраничная навигация"]');
	}

	function live(): string {
		return document.querySelector('[aria-live="polite"]')?.textContent ?? '';
	}

	it('без total полосы нет', () => {
		renderGrid();
		expect(footer()).toBeNull();
	});

	it('с total полоса внутри корпуса сразу после скроллера, сводка по total', () => {
		renderGrid({ total: 1250, defaultPageSize: 20 });
		const nav = footer();
		expect(nav).not.toBeNull();
		const root = document.querySelector('[data-s-kit-focus-inset]');
		expect(root?.contains(nav ?? null)).toBe(true);
		expect(nav?.parentElement?.previousElementSibling?.querySelector('table')).not.toBeNull();
		expect((nav?.querySelector('[data-pager-summary]')?.textContent ?? '').replace(/\s/g, ' ')).toBe('Записей 1–20 из 1 250');
	});

	it('колбэки пейджера доходят до страницы, строки грид не режет', () => {
		const onPageChange = vi.fn();
		renderGrid({ total: 100, defaultPageSize: 10, onPageChange });
		fireEvent.click(screen.getByRole('button', { name: 'Вперёд' }));
		expect(onPageChange).toHaveBeenCalledWith(2);
		expect(bodyRows()).toHaveLength(ROWS.length);
	});

	it('onRefresh показывает кнопку «Обновить»', () => {
		const onRefresh = vi.fn();
		renderGrid({ total: 100, onRefresh });
		fireEvent.click(screen.getByRole('button', { name: 'Обновить' }));
		expect(onRefresh).toHaveBeenCalledTimes(1);
	});

	it('loading грида блокирует пейджер', () => {
		renderGrid({ total: 100, defaultPage: 3, loading: true, onRefresh: vi.fn() });
		const buttons = [...(footer()?.querySelectorAll('button') ?? [])];
		expect(buttons.length).toBeGreaterThan(0);
		expect(buttons.every((button) => button.disabled)).toBe(true);
	});

	it('pagerLabels и pagerSummaryText переопределяют тексты', () => {
		renderGrid({ total: 100, pagerLabels: { next: 'Next' }, pagerSummaryText: (range) => `${range.total}` });
		expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
		expect(footer()?.querySelector('[data-pager-summary]')?.textContent).toBe('100');
	});

	it('объявление после загрузки считает total, а не строки страницы', () => {
		const foundText = vi.fn((count: number) => `найдено ${count}`);
		const [loading, setLoading] = createSignal(true);
		render(() => (
			<Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} total={500} loading={loading()} foundText={foundText}/>
		));
		setLoading(false);
		expect(foundText).toHaveBeenCalledWith(500);
		expect(live()).toBe('найдено 500');
	});

	it('пустая страница при ненулевом total остаётся состоянием «пусто» с полосой', () => {
		const [loading, setLoading] = createSignal(true);
		render(() => <Grid rows={[]} getRowKey={(row: Person) => row.id} columns={COLUMNS} total={500} loading={loading()}/>);
		setLoading(false);
		expect(live()).toBe('Ничего не найдено');
		expect(footer()).not.toBeNull();
	});
});

describe('Grid: состояние колонок', () => {
	function titles(): (string | null)[] {
		return [...table().querySelectorAll('thead th')].map((th) => th.textContent);
	}

	it('hiddenColumns перекрывает поля hidden: скрыта Заметка, Секрет показан', () => {
		renderGrid({ hiddenColumns: new Set(['note']) });
		expect(titles()).toEqual(['Имя', 'Номер', 'Возраст', 'Секрет']);
	});

	it('lockedColumns перекрывает поля locked: закреплена только Возраст и идёт первой', () => {
		renderGrid({ lockedColumns: new Set(['age']) });
		expect(titles()).toEqual(['Возраст', 'Имя', 'Номер', 'Заметка']);
		const sticky = [...table().querySelectorAll('thead th')].map((th) => th.hasAttribute('data-sticky'));
		expect(sticky).toEqual([true, false, false, false]);
	});

	it('defaultHiddenColumns и defaultLockedColumns задают начальное состояние без пропсов', () => {
		renderGrid({ defaultHiddenColumns: new Set(['age']), defaultLockedColumns: new Set(['note']) });
		// поля колонок игнорируются: Секрет больше не скрыт, закреплена только Заметка
		expect(titles()).toEqual(['Заметка', 'Имя', 'Секрет', 'Номер']);
	});

	it('controlled: смена hiddenColumns родителем скрывает и показывает колонку', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => (
			<Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} hiddenColumns={hidden()} aria-label='Люди'/>
		));
		expect(titles()).toEqual(['Имя', 'Номер', 'Возраст', 'Заметка']);
		setHidden(new Set(['secret', 'age']));
		expect(titles()).toEqual(['Имя', 'Номер', 'Заметка']);
		setHidden(new Set<string>());
		expect(titles()).toEqual(['Имя', 'Номер', 'Возраст', 'Секрет', 'Заметка']);
	});

	it('скрытие другой колонки не пересоздаёт шапку остальных', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => (
			<Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} hiddenColumns={hidden()} aria-label='Люди'/>
		));
		const before = [...table().querySelectorAll('thead th')].slice(0, 3);
		setHidden(new Set(['secret', 'note']));
		const after = [...table().querySelectorAll('thead th')].slice(0, 3);
		expect(after).toEqual(before);
		expect(after.every((cell) => cell.isConnected)).toBe(true);
	});

	it('ширины хранятся по id и переживают скрытие', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				virtualized={false}
				hiddenColumns={hidden()}
				defaultColumnWidths={{ note: 300 }}
				aria-label='Люди'
			/>
		));
		expect(table().style.getPropertyValue('--s-kit-grid-w-3')).toBe('300px');
		setHidden(new Set(['secret', 'note']));
		setHidden(new Set(['secret']));
		expect(table().style.getPropertyValue('--s-kit-grid-w-3')).toBe('300px');
	});
});

describe('Grid: меню колонки', () => {
	beforeEach(() => {
		// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
		HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
			this.removeAttribute('popover');
		});
		HTMLElement.prototype.hidePopover = vi.fn();
	});

	function menuButton(title: string): HTMLElement {
		return screen.getByRole('button', { name: `Меню колонки «${title}»` });
	}

	function openMenu(title: string): HTMLElement {
		fireEvent.click(menuButton(title));
		return screen.getByRole('menu');
	}

	function openList(title: string): void {
		openMenu(title);
		fireEvent.click(screen.getByRole('menuitem', { name: 'Список колонок' }));
	}

	// Esc закрывает по одному слою: сначала подменю, затем само меню
	function closeAll(): void {
		for (let step = 0; step < 2 && screen.queryAllByRole('menu').length > 0; step++) {
			fireEvent.keyDown(document.body, { key: 'Escape' });
		}
	}

	function headTitles(): (string | null)[] {
		return [...table().querySelectorAll('thead th')].map((th) => th.textContent);
	}

	function stickyHeads(): boolean[] {
		return [...table().querySelectorAll('thead th')].map((th) => th.hasAttribute('data-sticky'));
	}

	it('в каждой ячейке шапки есть кнопка с именем колонки и aria-haspopup', () => {
		renderGrid();
		expect(table().querySelectorAll('thead th [data-grid-column-menu]')).toHaveLength(4);
		expect(menuButton('Возраст').getAttribute('aria-haspopup')).toBe('menu');
		expect(menuButton('Возраст').getAttribute('aria-expanded')).toBe('false');
	});

	it('columnMenu={false} убирает кнопки', () => {
		renderGrid({ columnMenu: false });
		expect(table().querySelectorAll('[data-grid-column-menu]')).toHaveLength(0);
	});

	it('columnMenuLabels меняют подпись кнопки и пункты', () => {
		renderGrid({ columnMenuLabels: { button: (title) => `Menu ${title}`, lock: 'Pin', columns: 'Columns' } });
		fireEvent.click(screen.getByRole('button', { name: 'Menu Возраст' }));
		expect(screen.getByRole('menuitem', { name: 'Pin' })).toBeTruthy();
		fireEvent.click(screen.getByRole('menuitem', { name: 'Columns' }));
		expect(screen.getByRole('menu', { name: 'Columns' })).toBeTruthy();
	});

	it('клик открывает меню: «Закрепить» и подменю «Список колонок» с переключателями всех колонок, фокус на первом пункте', () => {
		renderGrid();
		const menu = openMenu('Возраст');
		expect(menu.getAttribute('aria-label')).toBe('Меню колонки «Возраст»');
		expect(menuButton('Возраст').getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Закрепить' }));
		const list = screen.getByRole('menuitem', { name: 'Список колонок' });
		expect(list.getAttribute('aria-haspopup')).toBe('menu');
		expect(screen.queryByRole('menuitemcheckbox')).toBeNull();
		fireEvent.click(list);
		const checkboxes = screen.getAllByRole('menuitemcheckbox');
		expect(checkboxes.map((item) => item.textContent)).toEqual(['Возраст', 'Имя', 'Секрет', 'Номер', 'Заметка']);
		expect(checkboxes.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'true', 'false', 'true', 'true']);
	});

	it('у закреплённой колонки пункт называется «Открепить»', () => {
		renderGrid();
		openMenu('Имя');
		expect(screen.getByRole('menuitem', { name: 'Открепить' })).toBeTruthy();
	});

	it('открытие мышью оставляет фокус на самом меню', () => {
		renderGrid();
		fireEvent.click(menuButton('Возраст'), { detail: 1 });
		expect(document.activeElement).toBe(screen.getByRole('menu'));
	});

	it('повторный клик по кнопке закрывает меню, клик по другой кнопке переносит его', () => {
		renderGrid();
		openMenu('Возраст');
		fireEvent.click(menuButton('Возраст'));
		expect(screen.queryByRole('menu')).toBeNull();
		openMenu('Возраст');
		fireEvent.click(menuButton('Имя'));
		expect(screen.getByRole('menu').getAttribute('aria-label')).toBe('Меню колонки «Имя»');
	});

	it('Esc закрывает меню', () => {
		renderGrid();
		openMenu('Возраст');
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('снятие галочки скрывает колонку: заголовок, ячейки и col исчезают, колбэк получает новый Set', () => {
		const onChange = vi.fn<(hidden: ReadonlySet<string>) => void>();
		renderGrid({ onHiddenColumnsChange: onChange });
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		expect(headTitles()).toEqual(['Имя', 'Номер', 'Возраст']);
		expect(table().querySelectorAll('colgroup > col')).toHaveLength(3);
		expect(table().querySelectorAll('tbody > tr[data-index]:first-child > td')).toHaveLength(3);
		expect(onChange).toHaveBeenCalledTimes(1);
		expect([...(onChange.mock.calls[0]?.[0] ?? [])]).toEqual(['secret', 'note']);
		expect(screen.getByRole('menu', { name: 'Список колонок' })).toBeTruthy();
	});

	it('галочка у скрытой колонки показывает её', () => {
		renderGrid();
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		expect(headTitles()).toContain('Секрет');
	});

	it('скрытие колонки из её же меню закрывает меню, фокус уходит на корень грида', () => {
		const { container } = renderGrid();
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Возраст' }));
		expect(screen.queryByRole('menu')).toBeNull();
		expect(headTitles()).toEqual(['Имя', 'Номер', 'Заметка']);
		expect(document.activeElement).toBe(container.firstElementChild);
	});

	it('последняя видимая колонка в меню отключена, остальные нет', () => {
		renderGrid({ defaultHiddenColumns: new Set(['secret', 'age', 'id', 'note']) });
		openList('Имя');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Имя' }).getAttribute('aria-disabled')).toBe('true');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Возраст' }).hasAttribute('aria-disabled')).toBe(false);
	});

	it('«Закрепить» закрепляет колонку и закрывает меню', () => {
		const onChange = vi.fn<(locked: ReadonlySet<string>) => void>();
		renderGrid({ onLockedColumnsChange: onChange });
		openMenu('Возраст');
		fireEvent.click(screen.getByRole('menuitem', { name: 'Закрепить' }));
		expect(screen.queryByRole('menu')).toBeNull();
		// закреплённые идут в порядке columns: Возраст стоит там раньше Имени
		expect(headTitles()).toEqual(['Возраст', 'Имя', 'Номер', 'Заметка']);
		expect(stickyHeads()).toEqual([true, true, true, false]);
		expect([...(onChange.mock.calls[0]?.[0] ?? [])]).toEqual(['name', 'id', 'age']);
	});

	it('«Открепить» возвращает колонку в обычные', () => {
		renderGrid();
		openMenu('Имя');
		fireEvent.click(screen.getByRole('menuitem', { name: 'Открепить' }));
		expect(stickyHeads()).toEqual([true, false, false, false]);
	});

	it('controlled: если родитель не принял изменение, колонка остаётся', () => {
		renderGrid({ hiddenColumns: new Set(['secret']), onHiddenColumnsChange: vi.fn() });
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		expect(headTitles()).toContain('Заметка');
	});

	it('на время loading кнопки отключены', () => {
		renderGrid({ loading: true });
		expect((menuButton('Возраст') as HTMLButtonElement).disabled).toBe(true);
	});

	it('правый клик по заголовку меню не открывает', () => {
		renderGrid();
		fireEvent.contextMenu(table().querySelector('thead th') as Element);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('onColumnMenuClose вызывается один раз при закрытии с видимыми id в порядке columns', () => {
		const onClose = vi.fn();
		renderGrid({ onColumnMenuClose: onClose });
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Возраст' }));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledWith(['name', 'id']);
	});

	it('onColumnMenuClose при закрытии Esc после изменения видимости', () => {
		const onClose = vi.fn();
		renderGrid({ onColumnMenuClose: onClose });
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		closeAll();
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledWith(['age', 'name', 'secret', 'id', 'note']);
	});

	it('onColumnMenuClose не вызывается, если видимость не менялась или менялось только закрепление', () => {
		const onClose = vi.fn();
		renderGrid({ onColumnMenuClose: onClose });
		openList('Возраст');
		closeAll();
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitem', { name: 'Закрепить' }));
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Секрет' }));
		closeAll();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('controlled: если родитель не принял изменения, onColumnMenuClose не вызывается', () => {
		const onClose = vi.fn();
		renderGrid({ hiddenColumns: new Set(['secret']), onHiddenColumnsChange: vi.fn(), onColumnMenuClose: onClose });
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		closeAll();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('размонтирование грида при открытом меню onColumnMenuClose не вызывает', () => {
		const onClose = vi.fn();
		const { unmount } = renderGrid({ onColumnMenuClose: onClose });
		openList('Возраст');
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Заметка' }));
		unmount();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('колонка, скрытая родителем при открытом меню, закрывает его', () => {
		const [hidden, setHidden] = createSignal<ReadonlySet<string>>(new Set(['secret']));
		render(() => (
			<Grid rows={ROWS} getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} hiddenColumns={hidden()} aria-label='Люди'/>
		));
		openMenu('Возраст');
		setHidden(new Set(['secret', 'age']));
		expect(screen.queryByRole('menu')).toBeNull();
	});
});

describe('Grid: автосуммы', () => {
	const PAGE = { age: 76, id: 6, name: 'не показывается', secret: 'скрыто' };
	const ALL = { age: 1200, id: 100 };

	function footRows(): HTMLTableRowElement[] {
		return [...table().querySelectorAll<HTMLTableRowElement>('tfoot > tr')];
	}

	function texts(row: HTMLTableRowElement | undefined): string[] {
		return [...(row?.cells ?? [])].map((cell) => cell.textContent.trim());
	}

	it('без pageTotals и totals tfoot нет', () => {
		renderGrid();
		expect(table().querySelector('tfoot')).toBeNull();
		expect(table().getAttribute('aria-rowcount')).toBe('4');
	});

	it('только pageTotals: одна строка «Итого на странице»', () => {
		renderGrid({ pageTotals: PAGE });
		expect(footRows()).toHaveLength(1);
		expect(texts(footRows()[0])[0]).toBe('Итого на странице');
	});

	it('только totals: одна строка «Итого по выборке», страничные значения не подставляются', () => {
		renderGrid({ totals: ALL });
		expect(footRows()).toHaveLength(1);
		expect(texts(footRows()[0])).toEqual(['Итого по выборке', '100', '1200', '']);
	});

	it('обе строки идут в порядке «страница, выборка»', () => {
		renderGrid({ pageTotals: PAGE, totals: ALL });
		expect(footRows().map((row) => texts(row)[0])).toEqual(['Итого на странице', 'Итого по выборке']);
	});

	it('первая колонка несёт подпись и не показывает свой итог, скрытая колонка и отсутствующий ключ дают пусто', () => {
		renderGrid({ pageTotals: PAGE });
		// порядок колонок: name (подпись), id, age, note (ключа нет)
		expect(texts(footRows()[0])).toEqual(['Итого на странице', '6', '76', '']);
		const label = footRows()[0]?.cells[0];
		expect(label?.tagName).toBe('TH');
		expect(label?.getAttribute('scope')).toBe('row');
		expect(label?.getAttribute('title')).toBe('Итого на странице');
	});

	it('aggregate колонки форматирует значение, значение undefined даёт пустую ячейку', () => {
		const aggregate = (value: unknown): JSX.Element => <i>{String(value)} лет</i>;
		const columns = COLUMNS.map((column) => (column.id === 'age' ? { ...column, aggregate } : column));
		renderGrid({ columns, pageTotals: { age: 76, id: undefined } });
		// id без значения входит в подпись
		expect(texts(footRows()[0])).toEqual(['Итого на странице', '76 лет', '']);
		expect(footRows()[0]?.querySelector('i')).not.toBeNull();
	});

	it('totalsLabels переопределяет подписи', () => {
		renderGrid({ pageTotals: {}, totals: {}, totalsLabels: { page: 'Страница', all: 'Всего' } });
		expect(footRows().map((row) => texts(row)[0])).toEqual(['Страница', 'Всего']);
	});

	it('пустой объект даёт строку только с подписью', () => {
		renderGrid({ totals: {} });
		// подпись занимает закреплённую колонку id без значения и не заходит на открепляемые
		expect(texts(footRows()[0])).toEqual(['Итого по выборке', '', '']);
		expect(footRows()[0]?.cells[0]?.getAttribute('colspan')).toBe('2');
	});

	it('подпись не растягивается на колонку со значением', () => {
		renderGrid({ totals: ALL });
		expect(footRows()[0]?.cells[0]?.getAttribute('colspan')).toBe('1');
	});

	it('разделитель закрепа получает подпись, под которой лежит последняя закреплённая колонка', () => {
		renderGrid({ totals: {} });
		expect(footRows()[0]?.cells[0]?.hasAttribute('data-sticky-last')).toBe(true);
	});

	it('выравнивание ячеек берётся из колонки, закреплённые колонки закреплены как в теле', () => {
		renderGrid({ pageTotals: PAGE });
		const cells = footRows()[0]?.cells;
		expect(cells?.[2]?.getAttribute('data-align')).toBe('end');
		expect(cells?.[0]?.hasAttribute('data-sticky')).toBe(true);
		expect(cells?.[0]?.style.insetInlineStart).toBe('var(--s-kit-grid-left-0)');
		expect(cells?.[1]?.hasAttribute('data-sticky-last')).toBe(true);
		expect(cells?.[2]?.hasAttribute('data-sticky')).toBe(false);
	});

	it('при выборе строк первая ячейка итогов это пустая закреплённая ячейка колонки чекбоксов', () => {
		renderGrid({ pageTotals: PAGE, selectable: true });
		const first = footRows()[0]?.cells[0];
		expect(first?.textContent).toBe('');
		expect(first?.hasAttribute('data-sticky')).toBe(true);
		expect(first?.style.insetInlineStart).toBe('0px');
		expect(footRows()[0]?.cells[1]?.textContent.trim()).toBe('Итого на странице');
	});

	it('двухстрочные итоги: верхняя помечена data-first, нижняя data-stacked нет', () => {
		renderGrid({ pageTotals: PAGE, totals: ALL });
		const [page, all] = footRows();
		expect(page?.cells[2]?.hasAttribute('data-first')).toBe(true);
		expect(page?.cells[2]?.hasAttribute('data-stacked')).toBe(true);
		expect(all?.cells[2]?.hasAttribute('data-first')).toBe(false);
		expect(all?.cells[2]?.hasAttribute('data-stacked')).toBe(false);
	});

	it('одна строка итогов не смещается', () => {
		renderGrid({ totals: ALL });
		const cell = footRows()[0]?.cells[2];
		expect(cell?.hasAttribute('data-first')).toBe(true);
		expect(cell?.hasAttribute('data-stacked')).toBe(false);
	});

	it('загрузка: значения заменены заглушками, подписи остаются', () => {
		renderGrid({ pageTotals: PAGE, loading: true });
		const row = footRows()[0];
		expect(texts(row)).toEqual(['Итого на странице', '', '', '']);
		expect(row?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
	});

	it('aria-rowcount и aria-rowindex продолжают нумерацию после строк', () => {
		renderGrid({ pageTotals: PAGE, totals: ALL });
		expect(table().getAttribute('aria-rowcount')).toBe('6');
		expect(footRows().map((row) => row.getAttribute('aria-rowindex'))).toEqual(['5', '6']);
	});

	it('клик по итогам не выбирает строки и не открывает меню строки', () => {
		const onSelectedKeysChange = vi.fn();
		const rowContextMenu = (): JSX.Element => <ContextMenu.Item>Пункт</ContextMenu.Item>;
		renderGrid({ pageTotals: PAGE, selectable: true, onSelectedKeysChange, rowContextMenu });
		const cell = footRows()[0]?.cells[3] as HTMLElement;
		fireEvent.click(cell);
		fireEvent.dblClick(cell);
		fireEvent.contextMenu(cell);
		expect(onSelectedKeysChange).not.toHaveBeenCalled();
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('смена pageTotals обновляет значения, появление и исчезновение totals добавляет и убирает строку', () => {
		const [pageTotals, setPageTotals] = createSignal<Readonly<Record<string, unknown>>>({ age: 1 });
		const [totals, setTotals] = createSignal<Readonly<Record<string, unknown>> | undefined>(undefined);
		render(() => (
			<Grid
				rows={ROWS}
				getRowKey={(row) => row.id}
				columns={COLUMNS}
				virtualized={false}
				pageTotals={pageTotals()}
				totals={totals()}
				aria-label='Люди'
			/>
		));
		expect(texts(footRows()[0])[1]).toBe('1');
		setPageTotals({ age: 2 });
		expect(texts(footRows()[0])[1]).toBe('2');
		setTotals({ age: 9 });
		expect(footRows()).toHaveLength(2);
		setTotals(undefined);
		expect(footRows()).toHaveLength(1);
	});
});

describe('Grid: группировка', () => {
	const G1: GridGroup<Person> = {
		key: 'g1',
		field: 'age',
		value: 31,
		count: 2,
		aggregates: { age: 62 },
		children: { kind: 'rows', items: [ROWS[0] as Person, ROWS[1] as Person] }
	};
	const G2: GridGroup<Person> = { key: 'g2', field: 'age', value: 45, count: 1, children: { kind: 'rows', items: [ROWS[2] as Person] } };
	const LAZY: GridGroup<Person> = { key: 'g3', field: 'age', value: 50, count: 40, children: { kind: 'not-loaded' } };

	function trs(): HTMLTableRowElement[] {
		return [...table().querySelectorAll<HTMLTableRowElement>('tbody > tr[data-index]')];
	}

	function kindsOf(): string[] {
		return trs().map((row) => row.dataset['kind'] ?? '');
	}

	it('без groups плоский режим не меняется: все строки data-kind=row', () => {
		renderGrid();
		expect(kindsOf()).toEqual(['row', 'row', 'row']);
	});

	it('с groups rows игнорируется, свёрнутые группы дают только заголовки с aria-expanded=false', () => {
		renderGrid({ groups: [G1, G2] });
		expect(kindsOf()).toEqual(['group', 'group']);
		const toggle = trs()[0]?.querySelector('button[aria-expanded]');
		expect(toggle?.getAttribute('aria-expanded')).toBe('false');
	});

	it('развёрнутая группа: заголовок, строки, подвал (при агрегатах), затем следующий заголовок', () => {
		renderGrid({ groups: [G1, G2], expandedGroupKeys: new Set(['g1']) });
		expect(kindsOf()).toEqual(['group', 'row', 'row', 'footer', 'group']);
		expect(trs()[1]?.textContent).toContain('Анна');
	});

	it('заголовок: «Колонка: значение» и счётчик; groupValue колонки форматирует значение', () => {
		renderGrid({ groups: [G1] });
		expect(trs()[0]?.textContent).toContain('Возраст: 31');
		expect(trs()[0]?.textContent).toContain('2');
		cleanup();
		const groupValue = (value: unknown): string => `${String(value)} лет`;
		const columns = COLUMNS.map((column) => (column.id === 'age' ? { ...column, groupValue } : column));
		renderGrid({ groups: [G1], columns });
		expect(trs()[0]?.textContent).toContain('Возраст: 31 лет');
	});

	it('свёрнутая группа показывает агрегаты в заголовке, развёрнутая в подвале', () => {
		const { unmount } = renderGrid({ groups: [G1] });
		const collapsed = trs()[0];
		expect(collapsed?.textContent).toContain('62');
		unmount();
		renderGrid({ groups: [G1], expandedGroupKeys: new Set(['g1']) });
		expect(trs()[0]?.textContent).not.toContain('62');
		expect(trs()[3]?.textContent).toContain('62');
		expect(trs()[3]?.textContent).toContain('Итого: Возраст: 31');
	});

	it('подпись группы занимает колонки без агрегатов (colspan) и не заходит на колонку с агрегатом', () => {
		renderGrid({ groups: [G1] });
		const label = trs()[0]?.querySelector('td');
		// порядок колонок: name, id (закреплены), age (агрегат), note
		expect(label?.getAttribute('colspan')).toBe('2');
	});

	it('развёрнутая группа без агрегатов: подпись занимает все колонки', () => {
		renderGrid({ groups: [G2], expandedGroupKeys: new Set(['g2']) });
		expect(trs()[0]?.querySelector('td')?.getAttribute('colspan')).toBe('4');
	});

	it('клик по заголовку и по шеврону переключает группу через onExpandedGroupKeysChange, прежний Set не мутируется', () => {
		const onChange = vi.fn();
		const initial = new Set<string>();
		renderGrid({ groups: [G1], expandedGroupKeys: initial, onExpandedGroupKeysChange: onChange });
		fireEvent.click(trs()[0] as HTMLElement);
		expect([...(onChange.mock.calls[0]?.[0] as Set<string>)]).toEqual(['g1']);
		fireEvent.click(trs()[0]?.querySelector('button') as HTMLElement);
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(initial.size).toBe(0);
	});

	it('без controlled-пропса группа разворачивается сама и свёрнутость переживает смену groups с теми же ключами', () => {
		const [groups, setGroups] = createSignal<readonly GridGroup<Person>[]>([G1]);
		render(() => <Grid getRowKey={(row) => row.id} columns={COLUMNS} virtualized={false} groups={groups()} aria-label='Люди'/>);
		fireEvent.click(trs()[0]?.querySelector('button') as HTMLElement);
		expect(kindsOf()).toEqual(['group', 'row', 'row', 'footer']);
		setGroups([{ ...G1 }, G2]);
		expect(kindsOf()).toEqual(['group', 'row', 'row', 'footer', 'group']);
	});

	it('aria-rowcount считает элементы, aria-rowindex идёт подряд', () => {
		renderGrid({ groups: [G1, G2], expandedGroupKeys: new Set(['g1']), pageTotals: {} });
		expect(table().getAttribute('aria-rowcount')).toBe('7');
		expect(trs().map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3', '4', '5', '6']);
		expect(table().querySelector('tfoot > tr')?.getAttribute('aria-rowindex')).toBe('7');
	});

	it('выбор: строка внутри группы выбирается по ключу, заголовок и подвал не выбираются', () => {
		const onSelectedKeysChange = vi.fn();
		renderGrid({ groups: [G1, G2], expandedGroupKeys: new Set(['g1']), selectable: true, onSelectedKeysChange });
		fireEvent.click(trs()[1]?.cells[3] as HTMLElement);
		expect([...(onSelectedKeysChange.mock.calls[0]?.[0] as Set<number>)]).toEqual([1]);
		onSelectedKeysChange.mockClear();
		fireEvent.click(trs()[3] as HTMLElement);
		fireEvent.click(trs()[4] as HTMLElement);
		expect(onSelectedKeysChange).not.toHaveBeenCalled();
	});

	it('главный чекбокс выбирает загруженные строки развёрнутых групп', () => {
		const onSelectedKeysChange = vi.fn();
		renderGrid({ groups: [G1, G2], expandedGroupKeys: new Set(['g1']), selectable: true, onSelectedKeysChange });
		fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать все строки' }));
		expect([...(onSelectedKeysChange.mock.calls[0]?.[0] as Set<number>)].sort()).toEqual([1, 2]);
	});

	it('двойной клик и меню строки на заголовке не срабатывают, на строке группы срабатывают', () => {
		const onRowDoubleClick = vi.fn();
		const rowContextMenu = (): JSX.Element => <ContextMenu.Item>Пункт</ContextMenu.Item>;
		renderGrid({ groups: [G1], expandedGroupKeys: new Set(['g1']), onRowDoubleClick, rowContextMenu });
		fireEvent.dblClick(trs()[0] as HTMLElement);
		fireEvent.contextMenu(trs()[0] as HTMLElement);
		expect(onRowDoubleClick).not.toHaveBeenCalled();
		expect(screen.queryByRole('menu')).toBeNull();
		fireEvent.dblClick(trs()[1]?.cells[0] as HTMLElement);
		expect(onRowDoubleClick).toHaveBeenCalledWith(ROWS[0]);
	});

	it('не загруженная развёрнутая группа даёт заглушку и вызывает onGroupExpand', () => {
		const onGroupExpand = vi.fn();
		renderGrid({ groups: [LAZY], expandedGroupKeys: new Set(['g3']), onGroupExpand });
		expect(kindsOf()).toEqual(['group', 'loading']);
		expect(trs()[1]?.textContent).toContain('Загрузка…');
		expect(onGroupExpand).toHaveBeenCalledWith('g3');
		expect(onGroupExpand).toHaveBeenCalledTimes(1);
	});

	it('свёрнутая не загруженная группа onGroupExpand не вызывает', () => {
		const onGroupExpand = vi.fn();
		renderGrid({ groups: [LAZY], onGroupExpand });
		expect(onGroupExpand).not.toHaveBeenCalled();
	});

	it('пустой groups даёт состояние «пусто»', () => {
		renderGrid({ groups: [] });
		expect(screen.getByText('Ничего не найдено')).toBeTruthy();
	});

	it('строки внутри группы получают отступ уровня, заголовок нет', () => {
		renderGrid({ groups: [G1], expandedGroupKeys: new Set(['g1']) });
		expect(trs()[1]?.style.getPropertyValue('--s-kit-grid-indent')).toBe('16px');
		expect(trs()[0]?.style.getPropertyValue('--s-kit-grid-indent')).toBe('');
	});
});
