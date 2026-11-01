import styles from './grid.module.css';

import { createMemo, For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridTotalsCell } from './grid-totals-cell';
import { totalsLabelSpan } from './totals-label-span';
import type { TotalsRow } from './totals-row';

export interface GridTotalsRowProps {
	row: TotalsRow;
	/** Номер строки среди строк итогов. */
	index: number;
	/** Сколько строк итогов в таблице. */
	count: number;
}

/** Строка итогов: пустая закреплённая ячейка колонки чекбоксов и ячейки по видимым колонкам. */
export function GridTotalsRow(props: GridTotalsRowProps): JSX.Element {
	const grid = useGrid();
	const first = (): boolean => props.index === 0;
	const span = createMemo(() => totalsLabelSpan(grid.columns(), props.row.values));
	const stacked = (): boolean => props.index < props.count - 1;
	return (
		<tr aria-rowindex={grid.itemCount() + 2 + props.index}>
			<Show when={grid.selectable()}>
				<td
					class={`${styles['totals-cell']} ${styles['select-cell']}`}
					data-sticky
					data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
					data-first={first() ? '' : undefined}
					data-stacked={stacked() ? '' : undefined}
					style={{ 'inset-inline-start': '0px' }}
				/>
			</Show>
			<Show when={grid.columns()[0]}>
				{(column) => (
					<GridTotalsCell column={column()} index={0} span={span()} row={props.row} first={first()} stacked={stacked()}/>
				)}
			</Show>
			<For each={grid.columns().slice(span())}>
				{(column, index) => (
					<GridTotalsCell column={column} index={span() + index()} span={1} row={props.row} first={first()} stacked={stacked()}/>
				)}
			</For>
		</tr>
	);
}
