import styles from './grid.module.css';

import { createMemo, type JSX } from 'solid-js';

import { leftVar } from './column-css-vars';
import { formatCellValue } from './format-cell-value';
import type { GridColumn } from './grid-column';
import { useGrid } from './grid-context';
import type { GridNode } from './grid-node';
import { GridNodeContent } from './grid-node-content';

export interface GridCellProps {
	column: GridColumn<unknown>;
	/** Индекс среди видимых колонок. */
	index: number;
	row: unknown;
	/** Узел дерева этой строки: в первой колонке ячейка получает шеврон и место под него. */
	node?: GridNode | undefined;
}

/** Собственная высота ячейки колонки с `rowHeight`; без неё ячейка берёт высоту строки из токенов. */
export function cellHeight(column: GridColumn<unknown>): string | undefined {
	return column.rowHeight === undefined ? undefined : `${column.rowHeight}px`;
}

export function GridCell(props: GridCellProps): JSX.Element {
	const grid = useGrid();
	const sticky = (): boolean => props.column.locked === true;
	// без `cell` ячейка показывает текст значения; с `cell` значение не читается
	const text = createMemo(() => (props.column.cell === undefined ? formatCellValue(props.column.value(props.row)) : ''));
	const content = (): JSX.Element => (props.column.cell === undefined ? text() : props.column.cell(props.row));
	// подпись шеврона называет узел текстом значения, даже если ячейка нарисована своим `cell`
	const nodeTitle = (): string => formatCellValue(props.column.value(props.row));
	return (
		<td
			class={styles['cell']}
			title={props.column.cell === undefined ? text() : undefined}
			data-sticky={sticky() ? '' : undefined}
			data-sticky-last={props.index === grid.lastStickyIndex() ? '' : undefined}
			data-align={props.column.align}
			data-indent={props.index === 0 ? '' : undefined}
			style={{
				'inset-inline-start': sticky() ? `var(${leftVar(props.index)})` : undefined,
				'--s-kit-grid-cell-h': cellHeight(props.column)
			}}
		>
			{props.index === 0 && props.node !== undefined
				? <GridNodeContent node={props.node} title={nodeTitle()}>{content()}</GridNodeContent>
				: content()}
		</td>
	);
}
