import { For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridTotalsRow } from './grid-totals-row';

/** Итоги внутри той же таблицы: колонки совпадают с телом и едут вместе с ним при горизонтальной прокрутке. */
export function GridTotals(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.totalsRows().length > 0}>
			<tfoot>
				<For each={grid.totalsRows()}>
					{(row, index) => <GridTotalsRow row={row} index={index()} count={grid.totalsRows().length}/>}
				</For>
			</tfoot>
		</Show>
	);
}
