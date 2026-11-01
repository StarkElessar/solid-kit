import { ContextMenu } from '@stark/solid-kit/context-menu';
import { Grid, type GridColumn, type GridSort, type RowKey } from '@stark/solid-kit/grid';
import { Select } from '@stark/solid-kit/select';
import { createMemo, createSignal, For, type JSX } from 'solid-js';

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

const ROW_COUNTS = ['10', '1000', '100000'] as const;
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
	const [menuLog, setMenuLog] = createSignal('ещё не было');
	const rows = createMemo(() => (empty() ? [] : sortRows(ALL_ORDERS.slice(0, Number(count())), sort())));

	return (
		<div class='grid-demo'>
			<div class='control-row'>
				<label>
					Строк
					<select data-grid-count onChange={(event) => setCount(pick(ROW_COUNTS, event.currentTarget.value, '100000'))}>
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
						data-grid-loading
						checked={loading()}
						onChange={(event) => setLoading(event.currentTarget.checked)}
					/>
					Загрузка
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
			<div class='grid-frame' data-grid-demo>
				<Grid<Order>
					rows={rows()}
					getRowKey={(row) => row.id}
					columns={COLUMNS}
					virtualized={virtualized()}
					selectable={selectable()}
					selectedKeys={selected()}
					onSelectedKeysChange={setSelected}
					sort={sort()}
					onSortChange={setSort}
					onRowDoubleClick={(row) => setDoubleLog(row.name)}
					loading={loading()}
					emptyHint='Измените условия поиска или сбросьте фильтры.'
					onEmptyReset={() => setEmpty(false)}
					rowContextMenu={menuEnabled() ? (row) => <RowMenu row={row} log={setMenuLog}/> : undefined}
					aria-label='Заказы'
					onColumnWidthsChange={(widths) => setWidthsLog(JSON.stringify(widths))}
				/>
			</div>
			<p>
				Выбрано строк: <output data-grid-selected-count>{selected().size}</output>. Последний <code>onRowDoubleClick</code>:{' '}
				<output data-grid-dblclick>{doubleLog()}</output>. Последний <code>onColumnWidthsChange</code>:{' '}
				<output data-grid-widths>{widthsLog()}</output>. Последний пункт меню строки:{' '}
				<output data-grid-menu-log>{menuLog()}</output>
			</p>
		</div>
	);
}
