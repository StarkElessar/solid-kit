import { For, type JSX, Show } from 'solid-js';

import { SELECT_WIDTH_VAR, widthVar } from './column-css-vars';
import { useGrid } from './grid-context';

/**
 * Ширины колонок читают CSS-переменные таблицы: ресайз меняет их напрямую в DOM. У последней колонки ширины нет: в `table-layout: fixed`
 * она получает остаток до ширины контейнера (спек 4а, раздел 4.2).
 */
export function GridColgroup(): JSX.Element {
	const grid = useGrid();
	const isLast = (index: number): boolean => index === grid.columns().length - 1;
	return (
		<colgroup>
			<Show when={grid.selectable()}>
				<col style={{ width: `var(${SELECT_WIDTH_VAR})` }}/>
			</Show>
			<For each={grid.columns()}>
				{(_column, index) => <col style={{ width: isLast(index()) ? undefined : `var(${widthVar(index())})` }}/>}
			</For>
		</colgroup>
	);
}
