import styles from './grid.module.css';

import { createMemo, For, type JSX, onCleanup, onMount, Show, untrack } from 'solid-js';

import { leftVar } from './column-css-vars';
import { useGrid } from './grid-context';
import type { GridGroup } from './grid-group';
import type { GridItem } from './grid-item';
import { groupTitle } from './group-title';
import { rescueFocus } from './rescue-focus';
import { totalsCellContent } from './totals-cell-content';
import { totalsLabelSpan } from './totals-label-span';

export interface GridGroupRowProps {
	/** Индекс элемента тела. */
	index: number;
	/** Подвал группы (строка `gsum`) вместо заголовка. */
	footer: boolean;
}

type GroupItem = Extract<GridItem<unknown>, { kind: 'group' | 'footer' }>;

const NO_AGGREGATES: Readonly<Record<string, unknown>> = {};

function Chevron(props: { expanded: boolean }): JSX.Element {
	return (
		<svg aria-hidden='true' viewBox='0 0 16 16' class={styles['group-chevron']} data-expanded={props.expanded ? '' : undefined}>
			<path d='M6 4l4 4-4 4' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>
		</svg>
	);
}

/**
 * Заголовок или подвал группы. Подпись занимает первую колонку и колонки без агрегатов; у развёрнутой группы агрегатов в заголовке
 * нет (они в подвале), поэтому подпись занимает все колонки (спек группировки, раздел 5).
 */
export function GridGroupRow(props: GridGroupRowProps): JSX.Element {
	const grid = useGrid();
	let element: HTMLTableRowElement | undefined;
	const read = (): GroupItem | undefined => {
		const item = grid.itemAt(props.index);
		return item?.kind === 'group' || item?.kind === 'footer' ? item : undefined;
	};
	// при сокращении списка Solid может пересчитать строку раньше, чем окно её уберёт: до удаления она держит последний элемент
	let last = untrack(read);
	const item = createMemo((): GroupItem | undefined => {
		last = read() ?? last;
		return last;
	});
	const group = (): GridGroup<unknown> | undefined => item()?.group;
	const expanded = (): boolean => {
		const current = item();
		return current?.kind === 'group' && current.expanded;
	};
	const column = () => grid.menuColumns().find((candidate) => candidate.id === group()?.field);
	const title = (): string => {
		const current = group();
		return current === undefined ? '' : groupTitle(column(), current, grid.groupingLabels().emptyValue);
	};
	// агрегаты в заголовке только у свёрнутой группы; в подвале всегда
	const showAggregates = (): boolean => props.footer || !expanded();
	const aggregates = (): Readonly<Record<string, unknown>> => (showAggregates() ? (group()?.aggregates ?? NO_AGGREGATES) : NO_AGGREGATES);
	const span = createMemo(() => (showAggregates() ? totalsLabelSpan(grid.columns(), aggregates()) : grid.columns().length));
	const stickyLast = (): boolean => grid.lastStickyIndex() >= 0 && grid.lastStickyIndex() < span();
	const first = (): boolean => grid.columns()[0]?.locked === true;
	const level = (): number => item()?.level ?? 0;

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
		<tr
			ref={element}
			class={styles['group-row']}
			data-index={props.index}
			data-kind={props.footer ? 'footer' : 'group'}
			aria-rowindex={props.index + 2}
		>
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
				colSpan={Math.max(span(), 1)}
				title={title()}
				data-sticky={first() ? '' : undefined}
				data-sticky-last={stickyLast() ? '' : undefined}
				style={{
					'inset-inline-start': first() ? `var(${leftVar(0)})` : undefined,
					'--s-kit-grid-indent': `${level() * 16}px`
				}}
			>
				<Show
					when={!props.footer}
					fallback={<span class={styles['group-text']}>{grid.groupingLabels().groupTotal(title())}</span>}
				>
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
						<Show when={column()?.groupValue} fallback={title()} keyed>
							{(render) => <>{column()?.title}: {render(group()?.value)}</>}
						</Show>
					</span>
					<span class={styles['group-count']}>{`· ${group()?.count ?? 0}`}</span>
				</Show>
			</td>
			<For each={grid.columns().slice(span())}>
				{(columnItem, offset) => (
					<td
						class={`${styles['cell']} ${styles['group-cell']}`}
						data-sticky={columnItem.locked === true ? '' : undefined}
						data-sticky-last={span() + offset() === grid.lastStickyIndex() ? '' : undefined}
						data-align={columnItem.align}
						style={{ 'inset-inline-start': columnItem.locked === true ? `var(${leftVar(span() + offset())})` : undefined }}
					>
						{totalsCellContent(columnItem, aggregates())}
					</td>
				)}
			</For>
		</tr>
	);
}
