import styles from './grid.module.css';

import { createMemo, For, type JSX, onCleanup, onMount, Show, untrack } from 'solid-js';

import { leftVar } from './column-css-vars';
import { useGrid } from './grid-context';
import type { GridItem } from './grid-item';
import { rescueFocus } from './rescue-focus';
import { totalsCellContent } from './totals-cell-content';

export interface GridGroupFooterRowProps {
	/** Индекс элемента тела. */
	index: number;
}

type FooterItem = Extract<GridItem<unknown>, { kind: 'footer' }>;

const NO_AGGREGATES: Readonly<Record<string, unknown>> = {};

/** Подвал группы: по ячейке на видимую колонку, агрегат стоит в своей колонке (в любой, и в первой), подписей нет. */
export function GridGroupFooterRow(props: GridGroupFooterRowProps): JSX.Element {
	const grid = useGrid();
	let element: HTMLTableRowElement | undefined;
	const read = (): FooterItem | undefined => {
		const item = grid.itemAt(props.index);
		return item?.kind === 'footer' ? item : undefined;
	};
	// при сокращении списка Solid может пересчитать строку раньше, чем окно её уберёт: до удаления она держит последний элемент
	let last = untrack(read);
	const item = createMemo((): FooterItem | undefined => {
		last = read() ?? last;
		return last;
	});
	const aggregates = (): Readonly<Record<string, unknown>> => item()?.group.aggregates ?? NO_AGGREGATES;

	onMount(() => {
		if (element) {
			grid.window.measure(element);
		}
	});
	onCleanup(() => {
		if (element) {
			rescueFocus(element, grid.rootElement);
		}
	});

	return (
		<tr ref={element} class={styles['group-row']} data-index={props.index} data-kind='footer' aria-rowindex={props.index + 2}>
			<Show when={grid.selectable()}>
				<td
					class={`${styles['cell']} ${styles['group-cell']} ${styles['select-cell']}`}
					data-sticky
					data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
					style={{ 'inset-inline-start': '0px' }}
				/>
			</Show>
			<For each={grid.columns()}>
				{(column, index) => (
					<td
						class={`${styles['cell']} ${styles['group-cell']}`}
						data-sticky={column.locked === true ? '' : undefined}
						data-sticky-last={index() === grid.lastStickyIndex() ? '' : undefined}
						data-align={column.align}
						style={{ 'inset-inline-start': column.locked === true ? `var(${leftVar(index())})` : undefined }}
					>
						{totalsCellContent(column, aggregates())}
					</td>
				)}
			</For>
		</tr>
	);
}
