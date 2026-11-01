import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { leftVar } from './column-css-vars';
import type { GridColumn } from './grid-column';
import { useGrid } from './grid-context';
import { totalsCellContent } from './totals-cell-content';
import type { TotalsRow } from './totals-row';

export interface GridTotalsCellProps {
	column: GridColumn<unknown>;
	/** Индекс среди видимых колонок. */
	index: number;
	row: TotalsRow;
	/** Это верхняя строка итогов. */
	first: boolean;
	/** Под этой строкой есть ещё строка итогов. */
	stacked: boolean;
}

/**
 * Ячейка итогов. Первая видимая колонка несёт подпись строки и свой итог не показывает (спек автосумм, раздел 3); остальные показывают
 * значение по id колонки, во время загрузки вместо него заглушка.
 */
export function GridTotalsCell(props: GridTotalsCellProps): JSX.Element {
	const grid = useGrid();
	const sticky = (): boolean => props.column.locked === true;
	return (
		<Show
			when={props.index === 0}
			fallback={(
				<td
					class={styles['totals-cell']}
					data-sticky={sticky() ? '' : undefined}
					data-sticky-last={props.index === grid.lastStickyIndex() ? '' : undefined}
					data-align={props.column.align}
					data-first={props.first ? '' : undefined}
					data-stacked={props.stacked ? '' : undefined}
					style={{ 'inset-inline-start': sticky() ? `var(${leftVar(props.index)})` : undefined }}
				>
					<Show when={!grid.loading()} fallback={<span aria-hidden='true' class={styles['skeleton-bar']}/>}>
						{totalsCellContent(props.column, props.row.values)}
					</Show>
				</td>
			)}
		>
			<th
				scope='row'
				class={`${styles['totals-cell']} ${styles['totals-label']}`}
				title={props.row.label}
				data-sticky={sticky() ? '' : undefined}
				data-sticky-last={props.index === grid.lastStickyIndex() ? '' : undefined}
				data-align={props.column.align}
				data-first={props.first ? '' : undefined}
				data-stacked={props.stacked ? '' : undefined}
				style={{ 'inset-inline-start': sticky() ? `var(${leftVar(props.index)})` : undefined }}
			>
				{props.row.label}
			</th>
		</Show>
	);
}
