import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { leftVar } from './column-css-vars';
import type { GridColumn } from './grid-column';
import { useGrid } from './grid-context';
import { GridResizeHandle } from './grid-resize-handle';
import { GridSortButton } from './grid-sort-button';

export interface GridHeaderCellProps {
	column: GridColumn<unknown>;
	/** Индекс среди видимых колонок: по нему называются CSS-переменные. */
	index: number;
}

export function GridHeaderCell(props: GridHeaderCellProps): JSX.Element {
	const grid = useGrid();
	const sticky = (): boolean => props.column.locked === true;
	const direction = (): 'asc' | 'desc' | undefined => {
		const active = grid.sort();
		return active?.columnId === props.column.id ? active.direction : undefined;
	};
	const ariaSort = (): 'ascending' | 'descending' | 'none' | undefined => {
		if (props.column.sortable !== true) {
			return undefined;
		}
		const current = direction();
		return current === undefined ? 'none' : current === 'asc' ? 'ascending' : 'descending';
	};
	return (
		<th
			scope='col'
			class={styles['head-cell']}
			data-sticky={sticky() ? '' : undefined}
			data-sticky-last={props.index === grid.lastStickyIndex() ? '' : undefined}
			data-align={props.column.align}
			aria-sort={ariaSort()}
			style={{ 'inset-inline-start': sticky() ? `var(${leftVar(props.index)})` : undefined }}
		>
			<Show when={props.column.sortable === true} fallback={props.column.title}>
				<GridSortButton
					title={props.column.title}
					direction={direction()}
					onClick={() => {
						grid.toggleSort(props.column.id);
					}}
				/>
			</Show>
			<GridResizeHandle index={props.index} columnId={props.column.id}/>
		</th>
	);
}
