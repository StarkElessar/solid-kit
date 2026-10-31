import styles from './grid.module.css';

import { createMemo, For, type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridRow } from './grid-row';
import { sameItems } from './same-items';

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
	const columnCount = (): number => grid.columns().length;
	return (
		<tbody>
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
