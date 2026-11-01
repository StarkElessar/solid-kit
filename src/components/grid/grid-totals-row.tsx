import styles from './grid.module.css';

import { For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridTotalsCell } from './grid-totals-cell';

export interface GridTotalsRowProps {
	values: Readonly<Record<string, unknown>>;
}

/** Строка автосумм: пустая закреплённая ячейка колонки чекбоксов и по ячейке на каждую видимую колонку. */
export function GridTotalsRow(props: GridTotalsRowProps): JSX.Element {
	const grid = useGrid();
	return (
		<tr aria-rowindex={grid.itemCount() + 2}>
			<Show when={grid.selectable()}>
				<td
					class={`${styles['totals-cell']} ${styles['select-cell']}`}
					data-sticky
					data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
					style={{ 'inset-inline-start': '0px' }}
				/>
			</Show>
			<For each={grid.columns()}>
				{(column, index) => <GridTotalsCell column={column} index={index()} values={props.values}/>}
			</For>
		</tr>
	);
}
