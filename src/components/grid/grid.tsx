import styles from './grid.module.css';

import { createMemo, createSignal, type JSX, onCleanup, onMount, untrack } from 'solid-js';

import { PanelHostContext } from '../../internal/panel/panel-host';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import { createFullWindow } from '../../utils/create-full-window';
import { createVirtualWindow } from '../../utils/create-virtual-window';
import { readControlHeight } from '../../utils/read-control-height';
import { readTokenPx } from '../../utils/read-token-px';
import type { RenderWindowOptions } from '../../utils/render-window';
import type { ContextMenuPoint } from '../context-menu';
import type { MenuOpenSource } from '../context-menu/context-menu-context';

import { buildRowIndex } from './build-row-index';
import { computeColumnLayout } from './column-layout';
import { createGridResize } from './create-grid-resize';
import { GridContext, type GridContextValue } from './grid-context';
import type { GridProps } from './grid-props';
import { GridRowMenu } from './grid-row-menu';
import type { GridSort } from './grid-sort';
import { GridTable } from './grid-table';
import { nextSort } from './next-sort';
import type { RowKey } from './row-key';
import type { RowMenuTarget } from './row-menu-target';
import { sameItems } from './same-items';
import { clearKeys, selectAllKeys, selectionOf, toggleKey } from './selection-state';

const FALLBACK_ROW_HEIGHT = 32;
const DEFAULT_OVERSCAN = 12;
const INITIAL_WINDOW_HEIGHT = 512;
const DEFAULT_SELECT_WIDTH = 44;
const NO_KEYS: ReadonlySet<RowKey> = new Set();

/**
 * Грид: «глупая» таблица с закреплённой шапкой, закреплёнными колонками и ресайзом колонок. Данные, ширины и (в следующих частях)
 * сортировку и выбор хранит страница. Раскладка колонок живёт в CSS-переменных таблицы (спек этапа 4а, раздел 4).
 */
export function Grid<T>(props: GridProps<T>): JSX.Element {
	const [widths, setWidths] = createControllableSignal<Readonly<Record<string, number>>>({
		name: 'Grid',
		value: () => props.columnWidths,
		defaultValue: () => props.defaultColumnWidths ?? {},
		onChange: (next) => props.onColumnWidthsChange?.(next)
	});
	const [selected, setSelected] = createControllableSignal<ReadonlySet<RowKey>>({
		name: 'Grid',
		value: () => props.selectedKeys,
		defaultValue: () => props.defaultSelectedKeys ?? NO_KEYS,
		onChange: (next) => props.onSelectedKeysChange?.(next)
	});
	const [selectWidth, setSelectWidth] = createSignal(DEFAULT_SELECT_WIDTH);
	const selectable = (): boolean => props.selectable === true;
	const layoutOptions = createMemo(() => ({ selectable: selectable(), selectWidth: selectWidth() }));
	const layout = createMemo(() => computeColumnLayout(props.columns, widths(), layoutOptions()));
	const columns = createMemo(() => layout().columns.map((item) => item.column), [], { equals: sameItems });
	const lastStickyIndex = createMemo(() => layout().columns.findLastIndex((item) => item.sticky));
	const rowIndex = createMemo(() => buildRowIndex(props.rows, props.getRowKey));
	const [sort, setSort] = createControllableSignal<GridSort | null>({
		name: 'Grid',
		value: () => props.sort,
		defaultValue: () => props.defaultSort ?? null,
		onChange: (next) => props.onSortChange?.(next)
	});
	const selectionState = createMemo(() => selectionOf(selected(), rowIndex().keys));

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
		scrollMargin: headerHeight,
		initialHeight: () => INITIAL_WINDOW_HEIGHT
	};

	const window = untrack(() => props.virtualized) === false ? createFullWindow(windowOptions) : createVirtualWindow(windowOptions);

	// скроллер отдаётся окну рендера после вставки в документ: виртуализатор пропускает ещё не вставленный элемент
	let rootElement: HTMLDivElement | undefined;
	const [root, setRoot] = createSignal<HTMLDivElement>();
	const [rowMenu, setRowMenu] = createSignal<RowMenuTarget>();
	let scrollerElement: HTMLDivElement | undefined;
	let header: HTMLTableSectionElement | undefined;

	const resize = createGridResize({
		columns: () => props.columns,
		widths,
		setWidths,
		layout,
		layoutOptions,
		scroller
	});

	const context: GridContextValue<T> = {
		rows: () => props.rows,
		rowIndex,
		layout,
		selectable,
		sort,
		toggleSort: (columnId) => {
			setSort(nextSort(sort(), columnId));
		},
		isRowSelected: (index) => {
			const key = rowIndex().keys[index];
			return key !== undefined && selected().has(key);
		},
		activateRow: (index) => {
			if (index < props.rows.length) {
				props.onRowDoubleClick?.(props.rows[index] as T);
			}
		},
		toggleRow: (index) => {
			const key = rowIndex().keys[index];
			if (key !== undefined) {
				setSelected(toggleKey(selected(), key));
			}
		},
		toggleAll: (checked) => {
			setSelected(checked ? selectAllKeys(selected(), rowIndex().keys) : clearKeys(selected(), rowIndex().keys));
		},
		selectionState,
		rootElement: root,
		hasRowMenu: () => props.rowContextMenu !== undefined,
		rowMenu,
		openRowMenu: (index: number, point: ContextMenuPoint, source: MenuOpenSource) => {
			if (index < props.rows.length) {
				setRowMenu({ point, source, row: props.rows[index] });
			}
		},
		closeRowMenu: () => {
			setRowMenu(undefined);
		},
		renderRowMenu: (row) => props.rowContextMenu?.(row as T),
		selectAllLabel: () => props.selectAllLabel ?? 'Выбрать все строки',
		selectRowLabel: () => props.selectRowLabel ?? 'Выбрать строку',
		columnCount: () => columns().length + (selectable() ? 1 : 0),
		columns,
		lastStickyIndex,
		window,
		beginResize: resize.beginResize,
		resetWidth: resize.resetWidth,
		headerRef: (element) => {
			header = element;
		}
	};

	onMount(() => {
		setScroller(scrollerElement);

		if (rootElement !== undefined) {
			setSelectWidth(readTokenPx(rootElement, ['--s-kit-grid-select-width'], DEFAULT_SELECT_WIDTH));
		}

		if (header === undefined) {
			return;
		}

		setHeaderHeight(header.offsetHeight);

		const observer = new ResizeObserver(() => {
			setHeaderHeight(header?.offsetHeight ?? 0);
		});

		observer.observe(header);

		onCleanup(() => {
			observer.disconnect();
		});
	});

	return (
		<GridContext.Provider value={context as unknown as GridContextValue<unknown>}>
			<PanelHostContext.Provider value={root}>
				<div
					ref={(element) => {
						rootElement = element;
						setRoot(element);
					}}
					data-s-kit
					data-s-kit-focus-inset
					tabindex='-1'
					class={props.class ? `${styles['root']} ${props.class}` : styles['root']}
					style={{
						...props.style,
						'--s-kit-grid-row-height': props.rowHeight === undefined ? undefined : `${props.rowHeight}px`
					}}
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
					<GridRowMenu/>
				</div>
			</PanelHostContext.Provider>
		</GridContext.Provider>
	);
}
