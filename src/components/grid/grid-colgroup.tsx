import { For, type JSX, Show } from 'solid-js';

import { SELECT_WIDTH_VAR, widthVar } from './column-css-vars';
import { useGrid } from './grid-context';

/**
 * Ширины колонок читают CSS-переменные таблицы: ресайз меняет их напрямую в DOM. Последняя колонка тоже своей ширины: таблица ровно
 * суммой ширин, остаток контейнера справа остаётся пустым.
 */
export function GridColgroup(): JSX.Element {
	const grid = useGrid();
	return (
		<colgroup>
			<Show when={grid.selectable()}>
				<col style={{ width: `var(${SELECT_WIDTH_VAR})` }}/>
			</Show>
			<For each={grid.columns()}>
				{(_column, index) => <col style={{ width: `var(${widthVar(index())})` }}/>}
			</For>
		</colgroup>
	);
}
