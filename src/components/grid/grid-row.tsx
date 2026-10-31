import styles from './grid.module.css';

import { createMemo, For, type JSX, onCleanup, onMount, Show } from 'solid-js';

import { GridCell } from './grid-cell';
import { useGrid } from './grid-context';
import { GridSelectCell } from './grid-select-cell';
import { rescueFocus } from './rescue-focus';

export interface GridRowProps {
	/** Индекс строки в `rows`. */
	index: number;
}

export function GridRow(props: GridRowProps): JSX.Element {
	const grid = useGrid();

	let element: HTMLTableRowElement | undefined;
	// при сокращении rows Solid может пересчитать ячейки раньше, чем окно уберёт эту строку: до удаления она держит последнюю строку
	let lastRow: unknown;

	// мемо по ссылке: смена массива `rows` с той же строкой не пересоздаёт её ячейки и не отнимает у них фокус
	const row = createMemo((): unknown => {
		const rows = grid.rows();
		if (props.index < rows.length) {
			lastRow = rows[props.index];
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
			data-row-key={grid.rowIndex().keys[props.index]}
			data-selected={grid.isRowSelected(props.index) ? '' : undefined}
			aria-selected={grid.isRowSelected(props.index) ? true : undefined}
			aria-rowindex={props.index + 2}
		>
			<Show when={grid.selectable()}>
				<GridSelectCell index={props.index}/>
			</Show>
			<For each={grid.columns()}>
				{(column, index) => <GridCell column={column} index={index()} row={row()}/>}
			</For>
		</tr>
	);
}
