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
			aria-label={props['aria-label']}
			aria-rowcount={grid.rows().length + 1 + grid.totalsRows().length}
			aria-colcount={grid.columnCount()}
			style={layoutCssVars(grid.layout())}
		>
			<GridColgroup/>
			<GridHeader/>
			<GridBody/>
			<GridTotals/>
		</table>
	);
}
