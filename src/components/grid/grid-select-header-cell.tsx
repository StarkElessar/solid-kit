import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { Checkbox } from '../checkbox';

import { useGrid } from './grid-context';

/** Заголовок колонки чекбоксов: главный чекбокс «все / часть / ничего» по ключам загруженных строк (`rows`). */
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
		>
			<Checkbox
				aria-label={grid.selectAllLabel()}
				checked={grid.selectionState() === 'all'}
				indeterminate={grid.selectionState() === 'some'}
				disabled={grid.loading()}
				onCheckedChange={(checked) => {
					grid.toggleAll(checked);
				}}
			/>
		</th>
	);
}
