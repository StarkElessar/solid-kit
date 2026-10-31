import styles from './grid.module.css';

import { For, type JSX } from 'solid-js';

import { GridCell } from './grid-cell';
import { useGrid } from './grid-context';

export interface GridRowProps {
	/** Индекс строки в `rows`. */
	index: number;
}

export function GridRow(props: GridRowProps): JSX.Element {
	const grid = useGrid();
	const row = (): unknown => grid.rows()[props.index];
	return (
		<tr
			ref={grid.window.measure}
			class={styles['row']}
			data-index={props.index}
			data-row-key={grid.rowIndex().keys[props.index]}
			aria-rowindex={props.index + 2}
		>
			<For each={grid.columns()}>{(column, index) => <GridCell column={column} index={index()} row={row()}/>}</For>
		</tr>
	);
}
