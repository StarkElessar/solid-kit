import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { useGrid } from './grid-context';

/** Заголовок колонки чекбоксов: закреплён у левого края; главный чекбокс добавляет следующая задача части. */
export function GridSelectHeaderCell(): JSX.Element {
	const grid = useGrid();
	return (
		<th
			scope='col'
			class={`${styles['head-cell']} ${styles['select-cell']}`}
			data-grid-select
			data-sticky
			data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
			style={{ 'inset-inline-start': '0px' }}
		/>
	);
}
