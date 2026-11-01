import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridDragGhost } from './grid-drag-ghost';
import { GridGroupingPanel } from './grid-grouping-panel';
import { GridGroupingToolbar } from './grid-grouping-toolbar';

/** Верхняя полоса корпуса: панель группировки слева, кнопки уровней справа. Есть только при `groupable`. */
export function GridGroupingBar(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.groupable()}>
			<div class={styles['bar']}>
				<GridGroupingPanel/>
				<GridGroupingToolbar/>
				<GridDragGhost/>
			</div>
		</Show>
	);
}
