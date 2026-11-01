import styles from './grid.module.css';

import { createMemo, For, type JSX, onCleanup, onMount, Show, untrack } from 'solid-js';

import { GridCell } from './grid-cell';
import { useGrid } from './grid-context';
import { GridSelectCell } from './grid-select-cell';
import { rescueFocus } from './rescue-focus';

export interface GridRowProps {
	/** Индекс элемента тела: по нему окно рендера измеряет строку; индекс листовой строки (`rowIndex`) от него может отличаться. */
	index: number;
}

export function GridRow(props: GridRowProps): JSX.Element {
	const grid = useGrid();

	let element: HTMLTableRowElement | undefined;
	// при сокращении rows Solid может пересчитать ячейки раньше, чем окно уберёт эту строку: до удаления она держит последнюю строку
	let lastRow: unknown;
	let lastRowIndex = untrack(() => grid.rowIndexOfItem(props.index) ?? 0);

	const rowIndex = createMemo((): number => {
		lastRowIndex = grid.rowIndexOfItem(props.index) ?? lastRowIndex;
		return lastRowIndex;
	});
	const level = (): number => grid.itemAt(props.index)?.level ?? 0;

	// мемо по ссылке: смена массива `rows` с той же строкой не пересоздаёт её ячейки и не отнимает у них фокус
	const row = createMemo((): unknown => {
		const rows = grid.rows();
		if (rowIndex() < rows.length) {
			lastRow = rows[rowIndex()];
		}
		return lastRow;
	});

	// измерение читает data-index: ref вызывается раньше, чем Solid выставит атрибуты, к монтированию они уже на месте
	onMount(() => {
		if (element) {
			grid.window.measure(element);
		}
	});

	// очистка идёт до удаления DOM: фокус из уходящей строки (или вернувшийся в неё из панели) переносится на корень грида
	onCleanup(() => {
		if (element) {
			rescueFocus(element, grid.rootElement);
		}
	});

	return (
		<tr
			ref={element}
			class={styles['row']}
			data-index={props.index}
			data-kind='row'
			data-row-key={grid.rowIndex().keys[rowIndex()]}
			data-selected={grid.isRowSelected(rowIndex()) ? '' : undefined}
			aria-selected={grid.isRowSelected(rowIndex()) ? true : undefined}
			aria-rowindex={props.index + 2}
			style={{ '--s-kit-grid-indent': level() > 0 ? `${level() * 16}px` : undefined }}
		>
			<Show when={grid.selectable()}>
				<GridSelectCell index={rowIndex()}/>
			</Show>
			<For each={grid.columns()}>
				{(column, index) => <GridCell column={column} index={index()} row={row()}/>}
			</For>
		</tr>
	);
}
