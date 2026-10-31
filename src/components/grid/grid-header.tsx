import { For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridHeaderCell } from './grid-header-cell';
import { GridSelectHeaderCell } from './grid-select-header-cell';

export function GridHeader(): JSX.Element {
	const grid = useGrid();
	return (
		<thead ref={grid.headerRef}>
			<tr aria-rowindex={1}>
				<Show when={grid.selectable()}>
					<GridSelectHeaderCell/>
				</Show>
				<For each={grid.columns()}>{(column, index) => <GridHeaderCell column={column} index={index()}/>}</For>
			</tr>
		</thead>
	);
}
