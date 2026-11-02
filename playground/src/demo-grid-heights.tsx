import { Grid, type GridColumn } from '@stark/solid-kit/grid';
import { type JSX } from 'solid-js';

interface Row {
	id: number;
	name: string;
	amount: number;
}

const ROWS: readonly Row[] = Array.from({ length: 12 }, (_, index) => ({
	id: index + 1,
	name: `Заказчик ${index + 1}`,
	amount: (index + 1) * 1000
}));

const COLUMNS: readonly GridColumn<Row>[] = [
	{ id: 'id', title: 'Номер', value: (row) => row.id, width: 90, align: 'end' },
	{ id: 'name', title: 'Заказчик', value: (row) => row.name },
	{ id: 'amount', title: 'Сумма', value: (row) => row.amount, align: 'end' }
];

const TOTALS = { amount: 78000 };

/** Четыре способа задать высоту грида: фиксированная, `fill` (с данными и без) и по умолчанию (с данными и без). */
export function DemoGridHeights(): JSX.Element {
	return (
		<div class='height-demos'>
			<figure>
				<figcaption>Фиксированная: токен --s-kit-grid-height 14rem</figcaption>
				<div data-height-demo='fixed'>
					<Grid<Row> rows={ROWS} columns={COLUMNS} getRowKey={(row) => row.id} style={{ '--s-kit-grid-height': '14rem' }}/>
				</div>
			</figure>
			<figure>
				<figcaption>fill в колонке 22rem: 3 строки, футер у нижнего края</figcaption>
				<div class='height-column' data-height-demo='fill'>
					<Grid<Row> fill rows={ROWS.slice(0, 3)} columns={COLUMNS} getRowKey={(row) => row.id} totals={TOTALS}/>
				</div>
			</figure>
			<figure>
				<figcaption>fill в колонке 16rem без данных: пустое состояние занимает всё</figcaption>
				<div class='height-column height-column-short' data-height-demo='fill-empty'>
					<Grid<Row> fill rows={[]} columns={COLUMNS} getRowKey={(row) => row.id}/>
				</div>
			</figure>
			<figure>
				<figcaption>По умолчанию: 3 строки, высота по содержимому</figcaption>
				<div data-height-demo='auto'>
					<Grid<Row> rows={ROWS.slice(0, 3)} columns={COLUMNS} getRowKey={(row) => row.id}/>
				</div>
			</figure>
			<figure>
				<figcaption>По умолчанию без данных: схлопывается</figcaption>
				<div data-height-demo='auto-empty'>
					<Grid<Row> rows={[]} columns={COLUMNS} getRowKey={(row) => row.id}/>
				</div>
			</figure>
		</div>
	);
}
