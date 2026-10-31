import styles from './grid.module.css';

import { For, type JSX, Show } from 'solid-js';

import { GridCell } from './grid-cell';
import { useGrid } from './grid-context';
import { GridSelectCell } from './grid-select-cell';

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
			data-selected={grid.isRowSelected(props.index) ? '' : undefined}
			aria-selected={grid.isRowSelected(props.index) ? true : undefined}
			aria-rowindex={props.index + 2}
		>
			<Show when={grid.selectable()}>
				<GridSelectCell index={props.index}/>
			</Show>
			<For each={grid.columns()}>{(column, index) => <GridCell column={column} index={index()} row={row()}/>}</For>
		</tr>
	);
}
