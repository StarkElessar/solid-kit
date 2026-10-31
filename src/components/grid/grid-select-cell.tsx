import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { useGrid } from './grid-context';

/** Ячейка колонки чекбоксов строки: закреплена у левого края; чекбокс добавляет следующая задача части. */
export function GridSelectCell(): JSX.Element {
	const grid = useGrid();
	return (
		<td
			class={`${styles['cell']} ${styles['select-cell']}`}
			data-grid-select
			data-sticky
			data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
			style={{ 'inset-inline-start': '0px' }}
		/>
	);
}
