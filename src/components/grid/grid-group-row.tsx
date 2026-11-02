import styles from './grid.module.css';

import { createMemo, type JSX, onCleanup, onMount, Show, untrack } from 'solid-js';

import { useGrid } from './grid-context';
import type { GridGroup } from './grid-group';
import type { GridItem } from './grid-item';
import { groupTitle } from './group-title';
import { groupValueText } from './group-value-text';
import { rescueFocus } from './rescue-focus';

export interface GridGroupRowProps {
	/** Индекс элемента тела. */
	index: number;
}

type GroupItem = Extract<GridItem<unknown>, { kind: 'group' }>;

function Chevron(props: { expanded: boolean }): JSX.Element {
	return (
		<svg aria-hidden='true' viewBox='0 0 16 16' class={styles['group-chevron']} data-expanded={props.expanded ? '' : undefined}>
			<path d='M6 4l4 4-4 4' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>
		</svg>
	);
}

/**
 * Заголовок группы: «стрелка, значение ячейки, Всего: N». Агрегатов в нём нет (они в подвале). Подпись лежит в закреплённой ячейке
 * (тот же `position: sticky` у `td`, что у закреплённых колонок), её текст свободно выходит за ширину первой колонки поверх соседних
 * пустых ячеек: при горизонтальной прокрутке заголовок не сдвигается ни на пиксель.
 */
export function GridGroupRow(props: GridGroupRowProps): JSX.Element {
	const grid = useGrid();
	let element: HTMLTableRowElement | undefined;
	const read = (): GroupItem | undefined => {
		const item = grid.itemAt(props.index);
		return item?.kind === 'group' ? item : undefined;
	};
	// при сокращении списка Solid может пересчитать строку раньше, чем окно её уберёт: до удаления она держит последний элемент
	let last = untrack(read);
	const item = createMemo((): GroupItem | undefined => {
		last = read() ?? last;
		return last;
	});
	const group = (): GridGroup<unknown> | undefined => item()?.group;
	const expanded = (): boolean => item()?.expanded === true;
	const column = () => grid.menuColumns().find((candidate) => candidate.id === group()?.field);
	const title = (): string => {
		const current = group();
		return current === undefined ? '' : groupTitle(column(), current, grid.groupingLabels().emptyValue);
	};

	onMount(() => {
		if (element) {
			grid.window.measure(element);
		}
	});
	onCleanup(() => {
		if (element) {
			rescueFocus(element, grid.rootElement);
		}
	});

	return (
		<tr ref={element} class={styles['group-row']} data-index={props.index} data-kind='group' aria-rowindex={props.index + 2}>
			<Show when={grid.selectable()}>
				<td
					class={`${styles['cell']} ${styles['group-cell']} ${styles['select-cell']}`}
					data-sticky
					data-sticky-last={grid.lastStickyIndex() === -1 ? '' : undefined}
					style={{ 'inset-inline-start': '0px' }}
				/>
			</Show>
			<td
				class={`${styles['cell']} ${styles['group-cell']} ${styles['group-label']}`}
				title={title()}
				data-sticky
				style={{ 'inset-inline-start': 'var(--s-kit-grid-select-w, 0px)' }}
			>
				<div class={styles['group-header']} data-group-header style={{ '--s-kit-grid-indent': `${(item()?.level ?? 0) * 16}px` }}>
					<button
						type='button'
						class={styles['group-toggle']}
						aria-expanded={expanded()}
						aria-label={expanded() ? grid.groupingLabels().collapse(title()) : grid.groupingLabels().expand(title())}
						onClick={() => {
							const key = group()?.key;
							if (key !== undefined) {
								grid.toggleGroup(key);
							}
						}}
					>
						<Chevron expanded={expanded()}/>
					</button>
					<span class={styles['group-text']}>
						<Show
							when={column()?.groupValue}
							fallback={groupValueText(group() as GridGroup<unknown>, grid.groupingLabels().emptyValue)}
							keyed
						>
							{(render) => render(group()?.value)}
						</Show>
					</span>
					<span class={styles['group-count']}>{grid.groupingLabels().groupCount(group()?.count ?? 0)}</span>
				</div>
			</td>
			<Show when={grid.columns().length > 1}>
				<td class={`${styles['cell']} ${styles['group-cell']}`} colSpan={grid.columns().length - 1}/>
			</Show>
		</tr>
	);
}
