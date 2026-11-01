import { ContextMenu } from '@stark/solid-kit/context-menu';
import { Grid, type GridColumn, type GridSort, type RowKey } from '@stark/solid-kit/grid';
import { Pager } from '@stark/solid-kit/pager';
import { Select } from '@stark/solid-kit/select';
import { createMemo, createSignal, For, type JSX, onCleanup } from 'solid-js';

import { runGridPerf } from './grid-perf';
import { pick } from './pick';

export interface Order {
	readonly id: number;
	readonly name: string;
	readonly team: string;
	readonly status: string;
	readonly amount: number;
	readonly city: string;
	readonly email: string;
	readonly phone: string;
	readonly created: Date;
	readonly score: number;
	readonly note: string;
	readonly active: boolean;
}

const TEAMS = ['Дизайн', 'Разработка', 'Аналитика', 'Поддержка'] as const;
const STATUSES = ['новый', 'в работе', 'готов', 'отклонён'] as const;
const CITIES = ['Москва', 'Казань', 'Самара', 'Тверь', 'Омск', 'Тула'] as const;
const NOTES = [
	'Без замечаний.',
	'Клиент просит перезвонить после обеда и уточнить сроки поставки по второй части заказа.',
	'Нужна консультация юриста по договору, приложение 3 не подписано.',
	'Повторный заказ.'
] as const;
const BASE_TIME = Date.UTC(2026, 0, 1);

/** Детерминированный генератор без сети и без Math.random: проверки воспроизводимы. */
function makeOrders(count: number): Order[] {
	return Array.from({ length: count }, (_, index) => ({
		id: index + 1,
		name: `Заказчик ${index + 1}`,
		team: TEAMS[index % TEAMS.length] ?? 'Дизайн',
		status: STATUSES[index % STATUSES.length] ?? 'новый',
		amount: (index * 7919) % 100_000,
		city: CITIES[index % CITIES.length] ?? 'Москва',
		email: `client${index + 1}@example.test`,
		phone: `+7 900 ${String(1_000_000 + ((index * 37) % 9_000_000))}`,
		created: new Date(BASE_TIME + index * 3_600_000),
		score: (index * 13) % 101,
		note: NOTES[index % NOTES.length] ?? '',
		active: index % 3 !== 0
	}));
}

export const ALL_ORDERS: readonly Order[] = makeOrders(100_000);

const COLUMNS: readonly GridColumn<Order>[] = [
	{ id: 'id', title: 'Номер', value: (row) => row.id, width: 90, locked: true, align: 'end', sortable: true },
	{ id: 'name', title: 'Заказчик', value: (row) => row.name, width: 160, locked: true, sortable: true },
	{
		id: 'team',
		title: 'Команда',
		value: (row) => row.team,
		cell: (row) => <button type='button' class='grid-action' data-grid-action>{row.team}</button>
	},
	{
		id: 'edit-status',
		title: 'Изменить статус',
		value: (row) => row.status,
		rowHeight: 56,
		width: 170,
		minWidth: 140,
		maxWidth: 200,
		cell: (row) => (
			<Select<string>
				items={STATUSES}
				getKey={(status) => status}
				getLabel={(status) => status}
				defaultValue={row.status}
				aria-label={`Статус ${row.name}`}
			/>
		)
	},
	{
		id: 'status',
		title: 'Статус',
		value: (row) => row.status,
		width: 130,
		cell: (row) => <span class='grid-status' data-status={row.status}>{row.status}</span>
	},
	{ id: 'amount', title: 'Сумма', value: (row) => row.amount, align: 'end', width: 120, sortable: true },
	{ id: 'city', title: 'Город', value: (row) => row.city },
	{ id: 'email', title: 'Почта', value: (row) => row.email, width: 220 },
	{ id: 'phone', title: 'Телефон', value: (row) => row.phone, width: 150 },
	{ id: 'created', title: 'Создан', value: (row) => row.created, width: 200, sortable: true },
	{ id: 'score', title: 'Оценка', value: (row) => row.score, align: 'end', width: 100, sortable: true },
	{
		id: 'note',
		title: 'Заметка с переносом',
		value: (row) => row.note,
		width: 260,
		cell: (row) => <span class='grid-wrap'>{row.note}</span>
	},
	{ id: 'active', title: 'Активен', value: (row) => row.active, width: 110, align: 'center' }
];

/** Высота, которую требуют колонки демо: ниже строки быть не могут. */
export const DEMO_MIN_ROW_HEIGHT = Math.max(...COLUMNS.map((column) => column.rowHeight ?? 0));

const ROW_COUNTS = ['10', '1000', '100000'] as const;
const DELAYS = ['0', '400', '2000'] as const;
const PAGER_SIZES = ['sm', 'md', 'lg'] as const;
const DEFAULT_PAGE_SIZE = 20;

interface PageRequest {
	readonly page: number;
	readonly size: number;
}
const COLLATOR = new Intl.Collator('ru');

function compareValues(first: unknown, second: unknown): number {
	if (typeof first === 'number' && typeof second === 'number') {
		return first - second;
	}
	if (first instanceof Date && second instanceof Date) {
		return first.getTime() - second.getTime();
	}
	return COLLATOR.compare(String(first), String(second));
}

/** Клиентская сортировка страницы: сам Grid строки не сортирует. */
function sortRows(rows: readonly Order[], sort: GridSort | null): readonly Order[] {
	const column = sort === null ? undefined : COLUMNS.find((candidate) => candidate.id === sort.columnId);
	if (sort === null || column === undefined) {
		return rows;
	}
	const sign = sort.direction === 'asc' ? 1 : -1;
	return [...rows].sort((first, second) => sign * compareValues(column.value(first), column.value(second)));
}

/** Пункты контекстного меню строки: простые пункты, разделитель и подменю; выбранное пишется в журнал страницы. */
function RowMenu(props: { row: Order; log: (text: string) => void }): JSX.Element {
	return (
		<>
			<ContextMenu.Item
				data-grid-menu-item='open'
				onSelect={() => {
					props.log(`Открыть ${props.row.name}`);
				}}
			>Открыть</ContextMenu.Item>
			<ContextMenu.Item
				data-grid-menu-item='copy'
				onSelect={() => {
					props.log(`Копировать номер ${props.row.id}`);
				}}
			>Копировать номер</ContextMenu.Item>
			<ContextMenu.Separator/>
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger>Статус</ContextMenu.SubTrigger>
				<ContextMenu.SubContent>
					<For each={['в работе', 'готов']}>
						{(status) => (
							<ContextMenu.Item
								onSelect={() => {
									props.log(`Статус ${props.row.name}: ${status}`);
								}}
							>{status}</ContextMenu.Item>
						)}
					</For>
				</ContextMenu.SubContent>
			</ContextMenu.Sub>
		</>
	);
}

/** Демонстрация Grid (страница «Грид»): число строк и виртуализация переключаются, последняя запись ширин видна. */
export function DemoGrid(): JSX.Element {
	const [count, setCount] = createSignal<(typeof ROW_COUNTS)[number]>('100000');
	const [virtualized, setVirtualized] = createSignal(true);
	const [selectable, setSelectable] = createSignal(true);
	const [sort, setSort] = createSignal<GridSort | null>(null);
	const [selected, setSelected] = createSignal<ReadonlySet<RowKey>>(new Set());
	const [widthsLog, setWidthsLog] = createSignal('ещё не менялись');
	const [doubleLog, setDoubleLog] = createSignal('ещё не было');
	const [loading, setLoading] = createSignal(false);
	const [empty, setEmpty] = createSignal(false);
	const [menuEnabled, setMenuEnabled] = createSignal(true);
	const [columnMenuEnabled, setColumnMenuEnabled] = createSignal(true);
	const [columnsLog, setColumnsLog] = createSignal('ещё не было');
	const [menuLog, setMenuLog] = createSignal('ещё не было');
	const [selectColumn, setSelectColumn] = createSignal(true);
	const [perfLog, setPerfLog] = createSignal<readonly string[]>([]);
	const [perfRunning, setPerfRunning] = createSignal(false);
	const columns = createMemo(() => (selectColumn() ? COLUMNS : COLUMNS.filter((column) => column.id !== 'edit-status')));
	const [paged, setPaged] = createSignal(false);
	const [delay, setDelay] = createSignal<(typeof DELAYS)[number]>('400');
	const [wanted, setWanted] = createSignal<PageRequest>({ page: 1, size: DEFAULT_PAGE_SIZE });
	const [served, setServed] = createSignal<PageRequest>({ page: 1, size: DEFAULT_PAGE_SIZE });
	const [serverLoading, setServerLoading] = createSignal(false);
	const [pageLog, setPageLog] = createSignal('ещё не было');
	let timer: number | undefined;
	let frame: HTMLDivElement | undefined;
	const sorted = createMemo(() => (empty() ? [] : sortRows(ALL_ORDERS.slice(0, Number(count())), sort())));
	const rows = createMemo(() => {
		if (!paged()) {
			return sorted();
		}
		const { page, size } = served();
		return sorted().slice((page - 1) * size, page * size);
	});

	/** Поддельный сервер: запрос сразу виден в пейджере, строки приходят через задержку. */
	function ask(next: PageRequest): void {
		setWanted(next);
		setPageLog(`страница ${next.page}, размер ${next.size}`);
		window.clearTimeout(timer);
		setServerLoading(true);
		timer = window.setTimeout(() => {
			setServed(next);
			setServerLoading(false);
		}, Number(delay()));
	}

	onCleanup(() => {
		window.clearTimeout(timer);
	});

	return (
		<div class='grid-demo'>
			<div class='control-row'>
				<label>
					Строк
					<select
						data-grid-count
						onChange={(event) => {
							setCount(pick(ROW_COUNTS, event.currentTarget.value, '100000'));
							ask({ page: 1, size: wanted().size });
						}}
					>
						<For each={ROW_COUNTS}>{(value) => <option value={value} selected={value === count()}>{value}</option>}</For>
					</select>
				</label>
				<label>
					<input
						type='checkbox'
						data-grid-virtualized
						checked={virtualized()}
						onChange={(event) => setVirtualized(event.currentTarget.checked)}
					/>
					Виртуализация
				</label>
				<label>
					<input
						type='checkbox'
						data-grid-selectable
						checked={selectable()}
						onChange={(event) => setSelectable(event.currentTarget.checked)}
					/>
					Выбор строк
				</label>
				<label>
					<input
						type='checkbox'
						data-grid-menu
						checked={menuEnabled()}
						onChange={(event) => setMenuEnabled(event.currentTarget.checked)}
					/>
					Меню строки
				</label>
				<label>
					<input
						type='checkbox'
						data-grid-column-menu-toggle
						checked={columnMenuEnabled()}
						onChange={(event) => setColumnMenuEnabled(event.currentTarget.checked)}
					/>
					Меню колонок
				</label>
				<label>
					<input
						type='checkbox'
						data-grid-select-column
						checked={selectColumn()}
						onChange={(event) => setSelectColumn(event.currentTarget.checked)}
					/>
					Колонка со Select
				</label>
				<button
					type='button'
					data-grid-perf-run
					disabled={perfRunning()}
					onClick={() => {
						const scroller = frame?.querySelector<HTMLElement>('[data-s-kit] > div');
						if (scroller === null || scroller === undefined) {
							return;
						}
						setPerfLog([]);
						setPerfRunning(true);
						void runGridPerf(scroller, (line) => setPerfLog((lines) => [...lines, line])).finally(() => setPerfRunning(false));
					}}
				>Замер прокрутки</button>
				<label>
					<input
						type='checkbox'
						data-grid-loading
						checked={loading()}
						onChange={(event) => setLoading(event.currentTarget.checked)}
					/>
					Загрузка
				</label>
				<label>
					<input
						type='checkbox'
						data-grid-paged
						checked={paged()}
						onChange={(event) => {
							setPaged(event.currentTarget.checked);
							ask({ page: 1, size: DEFAULT_PAGE_SIZE });
						}}
					/>
					Постраничная загрузка
				</label>
				<label>
					Задержка, мс
					<select data-grid-delay onChange={(event) => setDelay(pick(DELAYS, event.currentTarget.value, '400'))}>
						<For each={DELAYS}>{(value) => <option value={value} selected={value === delay()}>{value}</option>}</For>
					</select>
				</label>
				<label>
					<input
						type='checkbox'
						data-grid-empty
						checked={empty()}
						onChange={(event) => setEmpty(event.currentTarget.checked)}
					/>
					Пусто
				</label>
			</div>
			<div ref={frame} class='grid-frame' data-grid-demo>
				<Grid<Order>
					rows={rows()}
					getRowKey={(row) => row.id}
					columns={columns()}
					virtualized={virtualized()}
					selectable={selectable()}
					selectedKeys={selected()}
					onSelectedKeysChange={setSelected}
					sort={sort()}
					onSortChange={setSort}
					onRowDoubleClick={(row) => setDoubleLog(row.name)}
					loading={loading() || (paged() && serverLoading())}
					total={paged() ? Number(count()) : undefined}
					page={wanted().page}
					pageSize={wanted().size}
					onPageChange={(page) => {
						ask({ page, size: wanted().size });
					}}
					onPageSizeChange={(size) => {
						ask({ page: wanted().page, size });
					}}
					onRefresh={() => {
						ask(wanted());
					}}
					emptyHint='Измените условия поиска или сбросьте фильтры.'
					onEmptyReset={() => setEmpty(false)}
					rowContextMenu={menuEnabled() ? (row) => <RowMenu row={row} log={setMenuLog}/> : undefined}
					columnMenu={columnMenuEnabled()}
					onColumnMenuClose={(ids) => {
						setColumnsLog(ids.join(', '));
					}}
					aria-label='Заказы'
					onColumnWidthsChange={(widths) => setWidthsLog(JSON.stringify(widths))}
				/>
			</div>
			<p>
				Выбрано строк: <output data-grid-selected-count>{selected().size}</output>. Последний <code>onRowDoubleClick</code>:{' '}
				<output data-grid-dblclick>{doubleLog()}</output>. Последний <code>onColumnWidthsChange</code>:{' '}
				<output data-grid-widths>{widthsLog()}</output>. Последний пункт меню строки:{' '}
				<output data-grid-menu-log>{menuLog()}</output> Видимые колонки при закрытии меню колонки:{' '}
				<output data-grid-columns-log>{columnsLog()}</output>
			</p>
			<output data-grid-perf>{perfLog().length === 0 ? 'замер не запускался' : perfLog().join('; ')}</output>
			<p>
				Последний запрос страницы: <output data-grid-page-log>{pageLog()}</output>
			</p>
			<For each={PAGER_SIZES}>
				{(size) => (
					<div data-pager-standalone={size} class='pager-standalone'>
						<Pager
							total={1250}
							defaultPageSize={20}
							size={size}
							onRefresh={() => {
								setPageLog(`отдельный Pager ${size}: обновить`);
							}}
						/>
					</div>
				)}
			</For>
		</div>
	);
}
