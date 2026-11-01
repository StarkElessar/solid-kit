import { For, type JSX, Show } from 'solid-js';

import { ContextMenu } from '../context-menu';

import { useGrid } from './grid-context';

interface ColumnMenuItemsProps {
	columnId: string;
}

/** Пункты меню одной колонки: закрепление и переключатели видимости всех колонок. */
function ColumnMenuItems(props: ColumnMenuItemsProps): JSX.Element {
	const grid = useGrid();
	const locked = (): boolean => grid.lockedColumns().has(props.columnId);
	return (
		<>
			<ContextMenu.Item
				onSelect={() => {
					grid.toggleLocked(props.columnId);
				}}
			>{locked() ? grid.columnMenuLabels().unlock : grid.columnMenuLabels().lock}</ContextMenu.Item>
			<ContextMenu.Separator/>
			<ContextMenu.Group label={grid.columnMenuLabels().columns}>
				<For each={grid.menuColumns()}>
					{(column) => (
						<ContextMenu.CheckboxItem
							checked={!grid.hiddenColumns().has(column.id)}
							disabled={!grid.canHide(column.id)}
							onCheckedChange={() => {
								grid.toggleHidden(column.id);
							}}
						>{column.title}</ContextMenu.CheckboxItem>
					)}
				</For>
			</ContextMenu.Group>
		</>
	);
}

/** Одно меню колонки на весь грид: рисуется в хосте панели (корне грида), пункты строятся по колонке в момент открытия. */
export function GridColumnMenu(): JSX.Element {
	const grid = useGrid();
	const title = (): string => grid.menuColumns().find((column) => column.id === grid.columnMenu()?.columnId)?.title ?? '';
	return (
		<Show when={grid.hasColumnMenu()}>
			<ContextMenu.Root
				open={grid.columnMenu() !== undefined}
				onOpenChange={(open) => {
					if (!open) {
						grid.closeColumnMenu();
					}
				}}
				anchorElement={grid.columnMenu()?.anchor}
				anchorSource={grid.columnMenu()?.source}
				anchorArea={grid.rootElement()}
			>
				<ContextMenu.Content placement='bottom-end' aria-label={grid.columnMenuLabels().button(title())}>
					<Show when={grid.columnMenu()} keyed>
						{(target) => <ColumnMenuItems columnId={target.columnId}/>}
					</Show>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</Show>
	);
}
