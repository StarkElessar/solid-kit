import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Grid } from './grid';
import type { GridColumn } from './grid-column';

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
