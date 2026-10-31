import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { Checkbox } from '../checkbox';

import { useGrid } from './grid-context';

export interface GridSelectCellProps {
	/** Индекс строки в `rows`. */
	index: number;
}

/** Ячейка колонки чекбоксов строки. */
export function GridSelectCell(props: GridSelectCellProps): JSX.Element {
	const grid = useGrid();
	return (
		<td
			class={`${styles['cell']} ${styles['select-cell']}`}
			data-grid-select
			data-sticky
			data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
			style={{ 'inset-inline-start': '0px' }}
		>
			<Checkbox
				aria-label={grid.selectRowLabel()}
				checked={grid.isRowSelected(props.index)}
				onCheckedChange={() => {
					grid.toggleRow(props.index);
				}}
			/>
		</td>
	);
}
