import { For, type JSX } from 'solid-js';

import { widthVar } from './column-css-vars';
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
			<For each={grid.columns()}>
				{(_column, index) => <col style={{ width: isLast(index()) ? undefined : `var(${widthVar(index())})` }}/>}
			</For>
		</colgroup>
	);
}
