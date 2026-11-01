import styles from './grid.module.css';

import { createEffect, createMemo, createSignal, type JSX, on, onCleanup, onMount, Show, untrack } from 'solid-js';

import { PanelHostContext } from '../../internal/panel/panel-host';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import { createFullWindow } from '../../utils/create-full-window';
import { createVirtualWindow } from '../../utils/create-virtual-window';
import { readControlHeight } from '../../utils/read-control-height';
import { readTokenPx } from '../../utils/read-token-px';
import type { RenderWindowOptions } from '../../utils/render-window';
import type { ContextMenuPoint } from '../context-menu';
import type { MenuOpenSource } from '../context-menu/context-menu-context';

import { applyColumnState } from './apply-column-state';
import { buildRowIndex } from './build-row-index';
import { buildTotalsRows } from './build-totals-rows';
import { canHideColumn } from './can-hide-column';
import { computeColumnLayout } from './column-layout';
import type { ColumnMenuTarget } from './column-menu-target';
import { createGridResize } from './create-grid-resize';
import { DEFAULT_COLUMN_MENU_LABELS } from './default-column-menu-labels';
import { DEFAULT_TOTALS_LABELS } from './default-totals-labels';
import { foundText as defaultFoundText } from './found-text';
import { GridColumnMenu } from './grid-column-menu';
import { GridContext, type GridContextValue } from './grid-context';
import { GridFooter } from './grid-footer';
import { GridLiveRegion } from './grid-live-region';
import { GridProgress } from './grid-progress';
import type { GridProps } from './grid-props';
import { GridRowMenu } from './grid-row-menu';
import type { GridSort } from './grid-sort';
import { GridTable } from './grid-table';
import { idsWithFlag } from './ids-with-flag';
import { nextSort } from './next-sort';
import type { RowKey } from './row-key';
import type { RowMenuTarget } from './row-menu-target';
import { sameItems } from './same-items';
import { clearKeys, selectAllKeys, selectionOf, toggleKey } from './selection-state';
import { toggleId } from './toggle-id';
import { visibleColumnIds } from './visible-column-ids';

const FALLBACK_ROW_HEIGHT = 32;
const DEFAULT_OVERSCAN = 12;
const INITIAL_WINDOW_HEIGHT = 512;
const DEFAULT_SELECT_WIDTH = 44;
const MIN_SKELETON_ROWS = 5;
const MAX_SKELETON_ROWS = 20;
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
	const [hiddenColumns, setHiddenColumns] = createControllableSignal<ReadonlySet<string>>({
		name: 'Grid',
		value: () => props.hiddenColumns,
		defaultValue: () => props.defaultHiddenColumns ?? idsWithFlag(props.columns, 'hidden'),
		onChange: (next) => props.onHiddenColumnsChange?.(next)
	});
	const [lockedColumns, setLockedColumns] = createControllableSignal<ReadonlySet<string>>({
		name: 'Grid',
		value: () => props.lockedColumns,
		defaultValue: () => props.defaultLockedColumns ?? idsWithFlag(props.columns, 'locked'),
		onChange: (next) => props.onLockedColumnsChange?.(next)
	});
	// состояние колонок собирается из наборов; колонка, чьи флаги не менялись, остаётся прежним объектом
	const stateColumns = createMemo(() => applyColumnState(props.columns, hiddenColumns(), lockedColumns()), [], { equals: sameItems });
	const visibleIds = createMemo(() => visibleColumnIds(props.columns, hiddenColumns()), [], { equals: sameItems });
	const [selectWidth, setSelectWidth] = createSignal(DEFAULT_SELECT_WIDTH);
	const selectable = (): boolean => props.selectable === true;
	const layoutOptions = createMemo(() => ({ selectable: selectable(), selectWidth: selectWidth() }));
	const layout = createMemo(() => computeColumnLayout(stateColumns(), widths(), layoutOptions()));
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
		const base = props.rowHeight ?? (element === undefined ? FALLBACK_ROW_HEIGHT : readControlHeight(element));
		// строка не ниже самой требовательной видимой колонки: оценка окна совпадает с реальной высотой и строки не прыгают при измерении
		return Math.max(base, ...layout().columns.map((item) => item.column.rowHeight ?? 0));
	});

	const totalsRows = createMemo(() => {
		return buildTotalsRows(props.pageTotals, props.totals, { ...DEFAULT_TOTALS_LABELS, ...props.totalsLabels });
	});
	// строка итогов ровно высотой контрола (спек автосумм, раздел 3): строка, к которой прокручивают, не уходит под прилипшие итоги
	const totalsHeight = createMemo(() => {
		const element = scroller();
		return element === undefined ? 0 : totalsRows().length * readControlHeight(element);
	});

	const [viewWidth, setViewWidth] = createSignal(0);
	const loading = (): boolean => props.loading === true;
	const isEmpty = (): boolean => !loading() && props.rows.length === 0;
	const emptyText = (): string => props.emptyText ?? 'Ничего не найдено';
	// число заглушек считается в момент начала загрузки: строки, помещающиеся в скроллер, но не меньше 5 и не больше 20
	const skeletonCount = createMemo(() => {
		if (!loading()) {
			return 0;
		}
		const element = scroller();
		const fit = element === undefined ? 0 : Math.floor(element.clientHeight / estimate());
		return Math.min(Math.max(fit, MIN_SKELETON_ROWS), MAX_SKELETON_ROWS);
	});
	const [liveMessage, setLiveMessage] = createSignal('');

	// объявляется только окончание загрузки; при начале загрузки область очищается, чтобы повтор того же текста прозвучал снова
	createEffect(
		on(loading, (now, was) => {
			if (now) {
				setLiveMessage('');
			}
			else if (was === true) {
				// с пейджером найдено столько записей, сколько в выборке (`total`), а не сколько строк на странице
				const found = props.total ?? props.rows.length;
				setLiveMessage(props.rows.length === 0 ? emptyText() : (props.foundText ?? defaultFoundText)(found));
			}
		})
	);

	const windowOptions: RenderWindowOptions = {
		count: () => props.rows.length,
		scroller,
		estimateSize: () => estimate(),
		overscan: untrack(() => props.overscan) ?? DEFAULT_OVERSCAN,
		scrollPaddingStart: headerHeight,
		scrollPaddingEnd: totalsHeight,
		scrollMargin: headerHeight,
		initialHeight: () => INITIAL_WINDOW_HEIGHT
	};

	const window = untrack(() => props.virtualized) === false ? createFullWindow(windowOptions) : createVirtualWindow(windowOptions);

	// скроллер отдаётся окну рендера после вставки в документ: виртуализатор пропускает ещё не вставленный элемент
	let rootElement: HTMLDivElement | undefined;
	const [root, setRoot] = createSignal<HTMLDivElement>();
	const [rowMenu, setRowMenu] = createSignal<RowMenuTarget>();
	const [columnMenu, setColumnMenu] = createSignal<ColumnMenuTarget>();
	// видимые колонки в момент открытия: onColumnMenuClose сообщает итог, только если он изменился
	let visibleAtOpen: readonly string[] | undefined;
	const closeColumnMenu = (): void => {
		if (columnMenu() === undefined) {
			return;
		}
		setColumnMenu(undefined);
		const before = visibleAtOpen;
		visibleAtOpen = undefined;
		if (before !== undefined && !sameItems(before, visibleIds())) {
			props.onColumnMenuClose?.(visibleIds());
		}
	};
	const toggleColumnMenu = (columnId: string, anchor: HTMLElement, source: MenuOpenSource): void => {
		if (columnMenu()?.columnId === columnId) {
			closeColumnMenu();
			return;
		}
		if (columnMenu() === undefined) {
			visibleAtOpen = visibleIds();
		}
		setColumnMenu({ columnId, anchor, source });
	};
	// якорь исчез (колонку скрыли из её же меню или это сделал родитель): меню закрывается, фокус возвращается гриду
	createEffect(() => {
		const target = columnMenu();
		if (target !== undefined && !visibleIds().includes(target.columnId)) {
			untrack(closeColumnMenu);
		}
	});
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
		loading,
		loadingLabel: () => props.loadingLabel ?? 'Загрузка',
		isEmpty,
		emptyText,
		emptyHint: () => props.emptyHint,
		emptyResetLabel: () => props.emptyResetLabel ?? 'Сбросить фильтры',
		onEmptyReset: () => props.onEmptyReset,
		skeletonCount,
		liveMessage,
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
		hasColumnMenu: () => props.columnMenu !== false,
		columnMenu,
		toggleColumnMenu,
		closeColumnMenu,
		menuColumns: () => props.columns,
		hiddenColumns,
		lockedColumns,
		toggleHidden: (columnId) => {
			// последнюю видимую колонку скрыть нельзя (меню её отключает, это страховка)
			if (hiddenColumns().has(columnId) || canHideColumn(props.columns, hiddenColumns(), columnId)) {
				setHiddenColumns(toggleId(hiddenColumns(), columnId));
			}
		},
		toggleLocked: (columnId) => {
			setLockedColumns(toggleId(lockedColumns(), columnId));
		},
		canHide: (columnId) => canHideColumn(props.columns, hiddenColumns(), columnId),
		totalsRows,
		columnMenuLabels: () => ({ ...DEFAULT_COLUMN_MENU_LABELS, ...props.columnMenuLabels }),
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
		setViewWidth(scrollerElement?.clientWidth ?? 0);

		const observer = new ResizeObserver(() => {
			setHeaderHeight(header?.offsetHeight ?? 0);
			setViewWidth(scrollerElement?.clientWidth ?? 0);
		});

		observer.observe(header);

		if (scrollerElement !== undefined) {
			observer.observe(scrollerElement);
		}

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
					aria-busy={loading() ? 'true' : undefined}
					style={{
						...props.style,
						'--s-kit-grid-row-height': props.rowHeight === undefined ? undefined : `${props.rowHeight}px`,
						'--s-kit-grid-header-h': `${headerHeight()}px`,
						'--s-kit-grid-view-w': viewWidth() > 0 ? `${viewWidth()}px` : undefined
					}}
				>
					<GridProgress/>
					<div
						ref={scrollerElement}
						class={styles['scroller']}
						style={{
							'scroll-padding-block-start': `${headerHeight()}px`,
							'scroll-padding-block-end': `${totalsHeight()}px`,
							'scroll-padding-inline-start': `${layout().stickyWidth}px`
						}}
					>
						<GridTable aria-label={props['aria-label']}/>
					</div>
					<Show when={props.total !== undefined}>
						<GridFooter pager={props} loading={loading()}/>
					</Show>
					<GridRowMenu/>
					<GridColumnMenu/>
				</div>
				<GridLiveRegion/>
			</PanelHostContext.Provider>
		</GridContext.Provider>
	);
}
