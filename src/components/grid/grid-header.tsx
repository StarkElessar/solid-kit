import { For, type JSX } from 'solid-js';

import { useGrid } from './grid-context';
import { GridHeaderCell } from './grid-header-cell';

export function GridHeader(): JSX.Element {
	const grid = useGrid();
	return (
		<thead ref={grid.headerRef}>
			<tr aria-rowindex={1}>
				<For each={grid.columns()}>{(column, index) => <GridHeaderCell column={column} index={index()}/>}</For>
			</tr>
		</thead>
	);
}
