import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridDragGhost } from './grid-drag-ghost';
import { GridGroupingPanel } from './grid-grouping-panel';
import { GridLevelToolbar } from './grid-level-toolbar';

/** Верхняя полоса корпуса: панель группировки слева (при `groupable`), кнопки уровней справа. Есть у грида с группировкой и у дерева. */
export function GridBar(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.hasBar()}>
			<div class={styles['bar']}>
				<Show when={grid.groupable()}>
					<GridGroupingPanel/>
				</Show>
				<GridLevelToolbar
					labels={grid.levelLabels()}
					disabled={!grid.hasLevels() || grid.loading()}
					expandAllDisabled={!grid.canExpandAll()}
					onCollapseLevel={grid.collapseLevel}
					onCollapseAll={grid.collapseAll}
					onExpandLevel={grid.expandLevel}
					onExpandAll={grid.expandAll}
				/>
				<Show when={grid.groupable()}>
					<GridDragGhost/>
				</Show>
			</div>
		</Show>
	);
}
