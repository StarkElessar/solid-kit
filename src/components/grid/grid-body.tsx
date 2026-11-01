import styles from './grid.module.css';

import { createMemo, For, type JSX, Match, Show, Switch } from 'solid-js';

import { elementPoint } from '../context-menu/menu-point-anchor';

import { closestRow } from './closest-row';
import { useGrid } from './grid-context';
import { GridEmpty } from './grid-empty';
import { GridItemRow } from './grid-item-row';
import { GridSkeleton } from './grid-skeleton';
import { isInteractiveTarget } from './is-interactive-target';
import { sameItems } from './same-items';

/** Строка тела, в которую попало событие: `undefined` для spacer-строк и целей вне строки. */
function rowOfEvent(event: Event): { tr: HTMLTableRowElement; index: number } | undefined {
	const hit = closestRow(event.target);
	return hit === undefined || isInteractiveTarget(event.target, hit.tr) ? undefined : hit;
}

/**
 * Строки окна рендера между двумя spacer-строками (спек 4а, раздел 5). Строки ключуются индексом, а не элементом окна: окно создаёт
 * новые объекты при каждом сдвиге, а строка с тем же индексом должна сохранить DOM.
 */
export function GridBody(): JSX.Element {
	const grid = useGrid();
	const indexes = createMemo(() => grid.window.items().map((item) => item.index), [], { equals: sameItems });
	const topSpace = (): number => grid.window.items()[0]?.start ?? 0;
	const bottomSpace = (): number => {
		const all = grid.window.items();
		const last = all[all.length - 1];
		return last === undefined ? 0 : Math.max(grid.window.totalSize() - (last.start + last.size), 0);
	};
	const columnCount = (): number => grid.columnCount();
	return (
		<tbody
			onContextMenu={(event) => {
				const hit = grid.hasRowMenu() ? closestRow(event.target) : undefined;
				const rowIndex = hit === undefined ? undefined : grid.rowIndexOfItem(hit.index);
				if (rowIndex !== undefined) {
					event.preventDefault();
					grid.openRowMenu(rowIndex, { x: event.clientX, y: event.clientY }, 'pointer');
				}
			}}
			onKeyDown={(event) => {
				const hit = grid.hasRowMenu() && (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))
					? closestRow(event.target)
					: undefined;
				const rowIndex = hit === undefined ? undefined : grid.rowIndexOfItem(hit.index);
				if (rowIndex !== undefined) {
					event.preventDefault();
					const anchor = event.target instanceof Element ? event.target : event.currentTarget;
					grid.openRowMenu(rowIndex, elementPoint(anchor), 'keyboard');
				}
			}}
			onClick={(event) => {
				const hit = rowOfEvent(event);
				if (hit === undefined) {
					return;
				}
				const item = grid.itemAt(hit.index);
				// клик по заголовку группы (мимо кнопки-шеврона) переключает группу; подвалы и заглушки не отзываются
				if (item?.kind === 'group') {
					grid.toggleGroup(item.group.key);
				}
				else if (grid.selectable() && item?.kind === 'row') {
					grid.toggleRow(item.rowIndex);
				}
			}}
			onDblClick={(event) => {
				const hit = rowOfEvent(event);
				const rowIndex = hit === undefined ? undefined : grid.rowIndexOfItem(hit.index);
				if (rowIndex !== undefined) {
					grid.activateRow(rowIndex);
				}
			}}
		>
			<Switch>
				<Match when={grid.loading()}>
					<GridSkeleton/>
				</Match>
				<Match when={grid.isEmpty()}>
					<GridEmpty/>
				</Match>
				<Match when={true}>
					<Show when={topSpace() > 0}>
						<tr aria-hidden='true' role='presentation'>
							<td class={styles['spacer']} colSpan={columnCount()} style={{ height: `${topSpace()}px` }}/>
						</tr>
					</Show>
					<For each={indexes()}>{(index) => <GridItemRow index={index}/>}</For>
					<Show when={bottomSpace() > 0}>
						<tr aria-hidden='true' role='presentation'>
							<td class={styles['spacer']} colSpan={columnCount()} style={{ height: `${bottomSpace()}px` }}/>
						</tr>
					</Show>
				</Match>
			</Switch>
		</tbody>
	);
}
