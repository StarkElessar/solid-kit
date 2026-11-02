import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridTotalsRow } from './grid-totals-row';

/**
 * Глобальный футер внутри той же таблицы: колонки совпадают с телом и едут вместе с ним при горизонтальной прокрутке. Пустая строка-
 * «резинка» перед ним забирает свободную высоту скроллера (у таблицы `block-size: 100%`), поэтому, когда строк мало, футер стоит у
 * нижнего края грида, а не под последней строкой.
 */
export function GridTotals(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.totals()}>
			{(totals) => (
				<>
					<tbody aria-hidden='true' class={styles['totals-fill']}>
						<tr>
							<td colSpan={Math.max(grid.columnCount(), 1)}/>
						</tr>
					</tbody>
					<tfoot>
						<GridTotalsRow values={totals()}/>
					</tfoot>
				</>
			)}
		</Show>
	);
}
