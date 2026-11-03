import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { layoutCssVars } from './column-css-vars';
import { GridBody } from './grid-body';
import { GridColgroup } from './grid-colgroup';
import { useGrid } from './grid-context';
import { GridHeader } from './grid-header';
import { GridTotals } from './grid-totals';

export interface GridTableProps {
	'aria-label'?: string | undefined;
}

export function GridTable(props: GridTableProps): JSX.Element {
	const grid = useGrid();
	return (
		<table
			class={styles['table']}
			role={grid.isTree() ? 'treegrid' : undefined}
			aria-label={props['aria-label']}
			aria-rowcount={grid.itemCount() + 1 + (grid.totals() === undefined ? 0 : 1)}
			aria-colcount={grid.columnCount()}
			data-stretch={grid.fill() && grid.isEmpty() ? '' : undefined}
			data-totals={grid.totals() === undefined ? undefined : ''}
			style={layoutCssVars(grid.layout())}
		>
			<GridColgroup/>
			<GridHeader/>
			<GridBody/>
			<GridTotals/>
		</table>
	);
}
