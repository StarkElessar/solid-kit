import styles from './grid.module.css';

import { createMemo, For, type JSX, Show } from 'solid-js';

import { leftVar } from './column-css-vars';
import { cellHeight } from './grid-cell';
import { useGrid } from './grid-context';

/** Заглушки строк на время загрузки: по ячейке на колонку, без данных; закреплённые колонки и чекбокс остаются на месте при прокрутке. */
export function GridSkeleton(): JSX.Element {
	const grid = useGrid();
	const placeholders = createMemo(() => Array.from({ length: grid.skeletonCount() }, (_, index) => index));
	return (
		<For each={placeholders()}>
			{() => (
				<tr aria-hidden='true' class={styles['skeleton-row']}>
					<Show when={grid.selectable()}>
						<td
							class={`${styles['cell']} ${styles['select-cell']}`}
							data-sticky
							data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
							style={{ 'inset-inline-start': '0px' }}
						/>
					</Show>
					<For each={grid.columns()}>
						{(column, index) => (
							<td
								class={styles['cell']}
								data-sticky={column.locked === true ? '' : undefined}
								data-sticky-last={index() === grid.lastStickyIndex() ? '' : undefined}
								style={{
									'inset-inline-start': column.locked === true ? `var(${leftVar(index())})` : undefined,
									'--s-kit-grid-cell-h': cellHeight(column)
								}}
							>
								<span class={styles['skeleton-bar']}/>
							</td>
						)}
					</For>
				</tr>
			)}
		</For>
	);
}
