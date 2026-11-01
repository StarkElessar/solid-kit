import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { useGrid } from './grid-context';
import { GridToolbarButton } from './grid-toolbar-button';

const ARROW_DOWN = 'M4 6l4 4 4-4';
const ARROW_UP = 'M4 10l4-4 4 4';
const DOUBLE_DOWN = 'M4 3.5l4 4 4-4M4 8.5l4 4 4-4';
const DOUBLE_UP = 'M4 7.5l4-4 4 4M4 12.5l4-4 4 4';

function Icon(props: { path: string }): JSX.Element {
	return (
		<svg aria-hidden='true' viewBox='0 0 16 16'>
			<path d={props.path} fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>
		</svg>
	);
}

/** Четыре кнопки управления свёрнутостью: свернуть уровень, свернуть все, развернуть уровень, развернуть все (зонтичный, раздел 10.1). */
export function GridGroupingToolbar(): JSX.Element {
	const grid = useGrid();
	const disabled = (): boolean => !grid.hasGroups() || grid.loading();
	return (
		<div class={styles['toolbar']}>
			<GridToolbarButton label={grid.groupingLabels().collapseLevel} disabled={disabled()} onClick={grid.collapseLevel}>
				<Icon path={ARROW_DOWN}/>
			</GridToolbarButton>
			<GridToolbarButton label={grid.groupingLabels().collapseAll} disabled={disabled()} onClick={grid.collapseAll}>
				<Icon path={DOUBLE_UP}/>
			</GridToolbarButton>
			<GridToolbarButton label={grid.groupingLabels().expandLevel} disabled={disabled()} onClick={grid.expandLevel}>
				<Icon path={ARROW_UP}/>
			</GridToolbarButton>
			<GridToolbarButton label={grid.groupingLabels().expandAll} disabled={disabled()} onClick={grid.expandAll}>
				<Icon path={DOUBLE_DOWN}/>
			</GridToolbarButton>
		</div>
	);
}
