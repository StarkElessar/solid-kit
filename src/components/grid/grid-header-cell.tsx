import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { leftVar } from './column-css-vars';
import type { GridColumn } from './grid-column';
import { useGrid } from './grid-context';

export interface GridHeaderCellProps {
	column: GridColumn<unknown>;
	/** Индекс среди видимых колонок: по нему называются CSS-переменные. */
	index: number;
}

export function GridHeaderCell(props: GridHeaderCellProps): JSX.Element {
	const grid = useGrid();
	const sticky = (): boolean => props.column.locked === true;
	return (
		<th
			scope='col'
			class={styles['head-cell']}
			data-sticky={sticky() ? '' : undefined}
			data-sticky-last={props.index === grid.lastStickyIndex() ? '' : undefined}
			data-align={props.column.align}
			style={{ 'inset-inline-start': sticky() ? `var(${leftVar(props.index)})` : undefined }}
		>
			{props.column.title}
		</th>
	);
}
