import styles from './grid.module.css';

import { type JSX, onMount, untrack } from 'solid-js';

import { useGrid } from './grid-context';
import { indentOf } from './indent-of-level';

export interface GridLoadingGroupRowProps {
	/** Индекс элемента тела. */
	index: number;
}

/** Заглушка строк развёрнутой группы, которые ещё не загружены: при монтировании просит страницу их догрузить. */
export function GridLoadingGroupRow(props: GridLoadingGroupRowProps): JSX.Element {
	const grid = useGrid();
	let element: HTMLTableRowElement | undefined;
	const key = untrack(() => {
		const item = grid.itemAt(props.index);
		return item?.kind === 'loading' ? item.key : undefined;
	});
	const level = (): number => grid.itemAt(props.index)?.level ?? 1;

	onMount(() => {
		if (element) {
			grid.window.measure(element);
		}
		if (key !== undefined) {
			grid.loadGroup(key);
		}
	});

	return (
		<tr ref={element} class={styles['group-loading-row']} data-index={props.index} data-kind='loading' aria-rowindex={props.index + 2}>
			<td class={styles['empty-cell']} colSpan={grid.columnCount()}>
				<div class={styles['group-loading']} style={{ '--s-kit-grid-indent': `${indentOf(level())}px` }}>
					{grid.levelLabels().loadingRows}
				</div>
			</td>
		</tr>
	);
}
