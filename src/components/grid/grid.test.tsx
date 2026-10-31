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
