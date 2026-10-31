import styles from './grid.module.css';

import { createMemo, For, type JSX, Show } from 'solid-js';

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
						{() => (
							<td class={styles['cell']}>
								<span class={styles['skeleton-bar']}/>
							</td>
						)}
					</For>
				</tr>
			)}
		</For>
	);
}
