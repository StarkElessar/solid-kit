import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import type { GridLevelLabels } from './grid-level-labels';
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

export interface GridLevelToolbarProps {
	labels: GridLevelLabels;
	disabled: boolean;
	/** Отдельно отключает «развернуть все» (дерево с ленивой догрузкой). */
	expandAllDisabled?: boolean | undefined;
	onCollapseLevel: () => void;
	onCollapseAll: () => void;
	onExpandLevel: () => void;
	onExpandAll: () => void;
}

/**
 * Четыре кнопки управления свёрнутостью в таком порядке: свернуть уровень (↑), свернуть все (⇑), развернуть уровень (↓), развернуть все
 * (⇓). Сворачивание это стрелки вверх, разворачивание вниз (зонтичный, раздел 10.1). Одна на группы грида и узлы TreeList.
 */
export function GridLevelToolbar(props: GridLevelToolbarProps): JSX.Element {
	return (
		<div class={styles['toolbar']}>
			<GridToolbarButton label={props.labels.collapseLevel} disabled={props.disabled} onClick={props.onCollapseLevel}>
				<Icon path={ARROW_UP}/>
			</GridToolbarButton>
			<GridToolbarButton label={props.labels.collapseAll} disabled={props.disabled} onClick={props.onCollapseAll}>
				<Icon path={DOUBLE_UP}/>
			</GridToolbarButton>
			<GridToolbarButton label={props.labels.expandLevel} disabled={props.disabled} onClick={props.onExpandLevel}>
				<Icon path={ARROW_DOWN}/>
			</GridToolbarButton>
			<GridToolbarButton
				label={props.labels.expandAll}
				disabled={props.disabled || props.expandAllDisabled === true}
				onClick={props.onExpandAll}
			>
				<Icon path={DOUBLE_DOWN}/>
			</GridToolbarButton>
		</div>
	);
}
