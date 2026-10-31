import { Grid, type GridColumn } from '@stark/solid-kit/grid';
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
	{ id: 'id', title: 'Номер', value: (row) => row.id, width: 90, locked: true, align: 'end' },
	{ id: 'name', title: 'Заказчик', value: (row) => row.name, width: 160, locked: true },
	{ id: 'team', title: 'Команда', value: (row) => row.team },
	{
		id: 'status',
		title: 'Статус',
		value: (row) => row.status,
		width: 130,
		cell: (row) => <span class='grid-status' data-status={row.status}>{row.status}</span>
	},
	{ id: 'amount', title: 'Сумма', value: (row) => row.amount, align: 'end', width: 120 },
	{ id: 'city', title: 'Город', value: (row) => row.city },
	{ id: 'email', title: 'Почта', value: (row) => row.email, width: 220 },
	{ id: 'phone', title: 'Телефон', value: (row) => row.phone, width: 150 },
	{ id: 'created', title: 'Создан', value: (row) => row.created, width: 200 },
	{ id: 'score', title: 'Оценка', value: (row) => row.score, align: 'end', width: 100 },
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

/** Демонстрация Grid (страница «Грид»): число строк и виртуализация переключаются, последняя запись ширин видна. */
export function DemoGrid(): JSX.Element {
	const [count, setCount] = createSignal<(typeof ROW_COUNTS)[number]>('100000');
	const [virtualized, setVirtualized] = createSignal(true);
	const [widthsLog, setWidthsLog] = createSignal('ещё не менялись');
	const rows = createMemo(() => ALL_ORDERS.slice(0, Number(count())));

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
			</div>
			<div class='grid-frame' data-grid-demo>
				<Grid<Order>
					rows={rows()}
					getRowKey={(row) => row.id}
					columns={COLUMNS}
					virtualized={virtualized()}
					aria-label='Заказы'
					onColumnWidthsChange={(widths) => setWidthsLog(JSON.stringify(widths))}
				/>
			</div>
			<p>
				Последний <code>onColumnWidthsChange</code>: <output data-grid-widths>{widthsLog()}</output>
			</p>
		</div>
	);
}
