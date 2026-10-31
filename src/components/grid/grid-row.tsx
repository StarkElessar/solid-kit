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
	// при сокращении rows Solid может пересчитать ячейки раньше, чем окно уберёт эту строку: до удаления она держит последнюю строку
	let lastRow: unknown;
	const row = (): unknown => {
		const rows = grid.rows();
		if (props.index < rows.length) {
			lastRow = rows[props.index];
		}
		return lastRow;
	};
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
