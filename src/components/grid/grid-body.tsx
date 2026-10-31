import styles from './grid.module.css';

import { createMemo, For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridRow } from './grid-row';
import { isInteractiveTarget } from './is-interactive-target';
import { sameItems } from './same-items';

/** Строка тела, в которую попало событие: `undefined` для spacer-строк и целей вне строки. */
function rowOfEvent(event: Event): { tr: HTMLTableRowElement; index: number } | undefined {
	const tr = event.target instanceof Element ? event.target.closest<HTMLTableRowElement>('tr[data-index]') : null;
	if (tr === null || isInteractiveTarget(event.target, tr)) {
		return undefined;
	}
	return { tr, index: Number(tr.dataset['index']) };
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
			onClick={(event) => {
				const hit = grid.selectable() ? rowOfEvent(event) : undefined;
				if (hit !== undefined) {
					grid.toggleRow(hit.index);
				}
			}}
			onDblClick={(event) => {
				const hit = rowOfEvent(event);
				if (hit !== undefined) {
					grid.activateRow(hit.index);
				}
			}}
		>
			<Show when={topSpace() > 0}>
				<tr aria-hidden='true' role='presentation'>
					<td class={styles['spacer']} colSpan={columnCount()} style={{ height: `${topSpace()}px` }}/>
				</tr>
			</Show>
			<For each={indexes()}>{(index) => <GridRow index={index}/>}</For>
			<Show when={bottomSpace() > 0}>
				<tr aria-hidden='true' role='presentation'>
					<td class={styles['spacer']} colSpan={columnCount()} style={{ height: `${bottomSpace()}px` }}/>
				</tr>
			</Show>
		</tbody>
	);
}
