import styles from './grid.module.css';

import { createMemo, createSignal, type JSX, onCleanup, onMount, untrack } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { createFullWindow } from '../../utils/create-full-window';
import { readControlHeight } from '../../utils/read-control-height';
import type { RenderWindowOptions } from '../../utils/render-window';

import { buildRowIndex } from './build-row-index';
import { computeColumnLayout } from './column-layout';
import { GridContext, type GridContextValue } from './grid-context';
import type { GridProps } from './grid-props';
import { GridTable } from './grid-table';
import { sameItems } from './same-items';

const FALLBACK_ROW_HEIGHT = 32;
const DEFAULT_OVERSCAN = 12;

/**
 * Грид: «глупая» таблица с закреплённой шапкой, закреплёнными колонками и ресайзом колонок. Данные, ширины и (в следующих частях)
 * сортировку и выбор хранит страница. Раскладка колонок живёт в CSS-переменных таблицы (спек этапа 4а, раздел 4).
 */
export function Grid<T>(props: GridProps<T>): JSX.Element {
	const [widths] = createControllableSignal<Readonly<Record<string, number>>>({
		name: 'Grid',
		value: () => props.columnWidths,
		defaultValue: () => props.defaultColumnWidths ?? {},
		onChange: (next) => props.onColumnWidthsChange?.(next)
	});
	const layout = createMemo(() => computeColumnLayout(props.columns, widths(), { selectable: false, selectWidth: 0 }));
	const columns = createMemo(() => layout().columns.map((item) => item.column), [], { equals: sameItems });
	const lastStickyIndex = createMemo(() => layout().columns.findLastIndex((item) => item.sticky));
	const rowIndex = createMemo(() => buildRowIndex(props.rows, props.getRowKey));

	const [scroller, setScroller] = createSignal<HTMLElement | undefined>(undefined);
	const [headerHeight, setHeaderHeight] = createSignal(0);
	const estimate = createMemo(() => {
		const element = scroller();
		return props.rowHeight ?? (element === undefined ? FALLBACK_ROW_HEIGHT : readControlHeight(element));
	});

	const windowOptions: RenderWindowOptions = {
		count: () => props.rows.length,
		scroller,
		estimateSize: () => estimate(),
		overscan: untrack(() => props.overscan) ?? DEFAULT_OVERSCAN,
		scrollPaddingStart: headerHeight,
		scrollMargin: headerHeight
	};
	const window = createFullWindow(windowOptions);

	// скроллер отдаётся окну рендера после вставки в документ: виртуализатор пропускает ещё не вставленный элемент
	let scrollerElement: HTMLDivElement | undefined;
	let header: HTMLTableSectionElement | undefined;
	onMount(() => {
		setScroller(scrollerElement);
		if (header === undefined) {
			return;
		}
		const element = header;
		setHeaderHeight(element.offsetHeight);
		if (typeof ResizeObserver === 'undefined') {
			return;
		}
		const observer = new ResizeObserver(() => {
			setHeaderHeight(element.offsetHeight);
		});
		observer.observe(element);
		onCleanup(() => {
			observer.disconnect();
		});
	});

	const context: GridContextValue<T> = {
		rows: () => props.rows,
		rowIndex,
		layout,
		columns,
		lastStickyIndex,
		window,
		headerRef: (element) => {
			header = element;
		}
	};

	return (
		<GridContext.Provider value={context as unknown as GridContextValue<unknown>}>
			<div
				data-s-kit
				data-s-kit-focus-inset
				tabindex='-1'
				class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
				style={{ ...props.style, '--s-kit-grid-row-height': props.rowHeight === undefined ? undefined : `${props.rowHeight}px` }}
			>
				<div
					ref={scrollerElement}
					class={styles['scroller']}
					style={{
						'scroll-padding-block-start': `${headerHeight()}px`,
						'scroll-padding-inline-start': `${layout().stickyWidth}px`
					}}
				>
					<GridTable aria-label={props['aria-label']}/>
				</div>
			</div>
		</GridContext.Provider>
	);
}
