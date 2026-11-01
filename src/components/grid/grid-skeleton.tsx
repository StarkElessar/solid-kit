import styles from './grid.module.css';

import { createMemo, For, type JSX, Show } from 'solid-js';

import { cellHeight } from './grid-cell';
import { useGrid } from './grid-context';

/** Заглушки строк на время загрузки: по ячейке на колонку, без данных и без sticky. */
export function GridSkeleton(): JSX.Element {
	const grid = useGrid();
	const placeholders = createMemo(() => Array.from({ length: grid.skeletonCount() }, (_, index) => index));
	return (
		<For each={placeholders()}>
			{() => (
				<tr aria-hidden='true' class={styles['skeleton-row']}>
					<Show when={grid.selectable()}>
						<td class={`${styles['cell']} ${styles['select-cell']}`}/>
					</Show>
					<For each={grid.columns()}>
						{(column) => (
							<td class={styles['cell']} style={{ '--s-kit-grid-cell-h': cellHeight(column) }}>
								<span class={styles['skeleton-bar']}/>
							</td>
						)}
					</For>
				</tr>
			)}
		</For>
	);
}
