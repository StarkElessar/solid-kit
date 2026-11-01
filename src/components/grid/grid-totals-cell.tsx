import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { leftVar } from './column-css-vars';
import type { GridColumn } from './grid-column';
import { useGrid } from './grid-context';
import { totalsCellContent } from './totals-cell-content';

export interface GridTotalsCellProps {
	column: GridColumn<unknown>;
	/** Индекс среди видимых колонок. */
	index: number;
	values: Readonly<Record<string, unknown>>;
}

/** Ячейка автосумм своей колонки: значение по id колонки без подписи, во время загрузки заглушка. */
export function GridTotalsCell(props: GridTotalsCellProps): JSX.Element {
	const grid = useGrid();
	const sticky = (): boolean => props.column.locked === true;
	return (
		<td
			class={styles['totals-cell']}
			data-sticky={sticky() ? '' : undefined}
			data-sticky-last={props.index === grid.lastStickyIndex() ? '' : undefined}
			data-align={props.column.align}
			style={{ 'inset-inline-start': sticky() ? `var(${leftVar(props.index)})` : undefined }}
		>
			<Show when={!grid.loading()} fallback={<span aria-hidden='true' class={styles['skeleton-bar']}/>}>
				{totalsCellContent(props.column, props.values)}
			</Show>
		</td>
	);
}
