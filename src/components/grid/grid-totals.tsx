import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridTotalsRow } from './grid-totals-row';

/** Глобальный футер внутри той же таблицы: колонки совпадают с телом и едут вместе с ним при горизонтальной прокрутке. */
export function GridTotals(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.totals()}>
			{(totals) => (
				<tfoot>
					<GridTotalsRow values={totals()}/>
				</tfoot>
			)}
		</Show>
	);
}
