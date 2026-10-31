import { type JSX, Show } from 'solid-js';

import { ContextMenu } from '../context-menu';

import { useGrid } from './grid-context';

/** Одно контекстное меню на весь грид: рисуется только при `rowContextMenu`, пункты строятся по строке в момент открытия. */
export function GridRowMenu(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.hasRowMenu()}>
			<ContextMenu.Root
				open={grid.rowMenu() !== undefined}
				onOpenChange={(open) => {
					if (!open) {
						grid.closeRowMenu();
					}
				}}
				anchorPoint={grid.rowMenu()?.point}
				anchorSource={grid.rowMenu()?.source}
				anchorArea={grid.rootElement()}
			>
				<ContextMenu.Content>
					<Show when={grid.rowMenu()} keyed>
						{(target) => grid.renderRowMenu(target.row)}
					</Show>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</Show>
	);
}
