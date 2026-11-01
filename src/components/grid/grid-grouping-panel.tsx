import styles from './grid.module.css';

import { For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridGroupingChip } from './grid-grouping-chip';

/** Панель группировки: чипы колонок по порядку вложенности, пустая показывает подсказку. */
export function GridGroupingPanel(): JSX.Element {
	const grid = useGrid();
	return (
		<div class={styles['panel']} role='group' aria-label={grid.groupingLabels().panel} data-grouping-panel>
			<Show when={grid.grouping().length === 0}>
				<span class={styles['panel-hint']}>{grid.groupingLabels().hint}</span>
			</Show>
			<For each={grid.grouping()}>
				{(id) => (
					<GridGroupingChip
						columnId={id}
						title={grid.menuColumns().find((column) => column.id === id)?.title ?? id}
					/>
				)}
			</For>
		</div>
	);
}
