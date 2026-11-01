import { type Accessor, createContext, type JSX, useContext } from 'solid-js';

import type { RenderWindow } from '../../utils/render-window';
import type { ContextMenuPoint } from '../context-menu';
import type { MenuOpenSource } from '../context-menu/context-menu-context';

import type { RowIndex } from './build-row-index';
import type { ColumnLayout } from './column-layout';
import type { ColumnMenuTarget } from './column-menu-target';
import type { GridColumn } from './grid-column';
import type { GridColumnMenuLabels } from './grid-column-menu-labels';
import type { GridGroupingLabels } from './grid-grouping-labels';
import type { GridItem } from './grid-item';
import type { GridSort } from './grid-sort';
import type { RowMenuTarget } from './row-menu-target';
import type { SelectionState } from './selection-state';
import type { TotalsRow } from './totals-row';

export interface GridContextValue<T> {
	/** Листовые строки: все строки плоского режима или строки загруженных развёрнутых групп в порядке показа. */
	rows: Accessor<readonly T[]>;
	/** Число элементов тела (строки, заголовки и подвалы групп, заглушки): столько строк считает окно рендера. */
	itemCount: Accessor<number>;
	itemAt: (index: number) => GridItem<unknown> | undefined;
	/** Индекс листовой строки для элемента `index`; `undefined` у заголовков, подвалов и заглушек. */
	rowIndexOfItem: (index: number) => number | undefined;
	expandedGroupKeys: Accessor<ReadonlySet<string>>;
	toggleGroup: (key: string) => void;
	/** Строка-заглушка ещё не загруженной группы смонтирована: `onGroupExpand(key)`. */
	loadGroup: (key: string) => void;
	groupingLabels: Accessor<GridGroupingLabels>;
	/** Панель группировки, пункт меню колонки и перетаскивание включены. */
	groupable: Accessor<boolean>;
	/** Id группирующих колонок по порядку; только колонки, которые есть в `columns`. */
	grouping: Accessor<readonly string[]>;
	/** Можно ли группировать по колонке (`groupable` грида и `GridColumn.groupable !== false`). */
	canGroup: (columnId: string) => boolean;
	setGrouping: (next: readonly string[]) => void;
	/** Колонка в группировке или вне её (пункт меню). */
	toggleGrouping: (columnId: string) => void;
	/** Есть ли сгруппированные данные (`groups` не пуст): кнопки уровней работают только с ними. */
	hasGroups: Accessor<boolean>;
	collapseLevel: () => void;
	collapseAll: () => void;
	expandLevel: () => void;
	expandAll: () => void;
	rowIndex: Accessor<RowIndex>;
	layout: Accessor<ColumnLayout<T>>;
	/** Видимые колонки в порядке показа. Список не пересоздаётся при смене ширин: шапка и ячейки живут между ресайзами. */
	columns: Accessor<readonly GridColumn<T>[]>;
	selectable: Accessor<boolean>;
	sort: Accessor<GridSort | null>;
	/** Клик по заголовку колонки `columnId`: следующая сортировка по циклу. */
	toggleSort: (columnId: string) => void;
	/** Выбрана ли строка с индексом `index`. */
	isRowSelected: (index: number) => boolean;
	toggleRow: (index: number) => void;
	/** Двойной клик по строке `index`: `onRowDoubleClick(row)`. */
	activateRow: (index: number) => void;
	/** Главный чекбокс: выбрать (`true`) или снять (`false`) все ключи загруженных строк. */
	toggleAll: (checked: boolean) => void;
	selectionState: Accessor<SelectionState>;
	selectAllLabel: Accessor<string>;
	selectRowLabel: Accessor<string>;
	/** Число колонок таблицы с колонкой чекбоксов: `aria-colcount` и `colspan` spacer-строк. */
	columnCount: Accessor<number>;
	/** Индекс последней закреплённой колонки (правый разделитель закрепа), -1 если закреплённых нет. */
	lastStickyIndex: Accessor<number>;
	window: RenderWindow;
	/** `pointerdown` на ручке колонки `index` (среди видимых колонок). */
	beginResize: (index: number, event: PointerEvent) => void;
	/** Двойной клик по ручке: возврат к `GridColumn.width`. */
	resetWidth: (columnId: string) => void;
	loading: Accessor<boolean>;
	loadingLabel: Accessor<string>;
	/** Строк нет и загрузки нет. */
	isEmpty: Accessor<boolean>;
	emptyText: Accessor<string>;
	emptyHint: Accessor<JSX.Element>;
	emptyResetLabel: Accessor<string>;
	onEmptyReset: Accessor<(() => void) | undefined>;
	/** Число заглушек строк на время загрузки: строки, помещающиеся в скроллер, от 5 до 20. */
	skeletonCount: Accessor<number>;
	/** Текст скрытой live-области. */
	liveMessage: Accessor<string>;
	/** Корень грида: хост панелей, область вызова меню строки и запасной получатель фокуса. */
	rootElement: Accessor<HTMLElement | undefined>;
	hasRowMenu: Accessor<boolean>;
	/** Открытое меню строки; `undefined`, пока закрыто. */
	rowMenu: Accessor<RowMenuTarget | undefined>;
	openRowMenu: (index: number, point: ContextMenuPoint, source: MenuOpenSource) => void;
	closeRowMenu: () => void;
	renderRowMenu: (row: unknown) => JSX.Element;
	hasColumnMenu: Accessor<boolean>;
	/** Открытое меню колонки; `undefined`, пока закрыто. */
	columnMenu: Accessor<ColumnMenuTarget | undefined>;
	/** Клик по кнопке колонки: закрывает меню этой колонки, если оно открыто, иначе открывает. */
	toggleColumnMenu: (columnId: string, anchor: HTMLElement, source: MenuOpenSource) => void;
	closeColumnMenu: () => void;
	/** Все колонки в порядке `columns`, включая скрытые: пункты видимости меню. */
	menuColumns: Accessor<readonly GridColumn<T>[]>;
	hiddenColumns: Accessor<ReadonlySet<string>>;
	lockedColumns: Accessor<ReadonlySet<string>>;
	toggleHidden: (columnId: string) => void;
	toggleLocked: (columnId: string) => void;
	/** `false` у последней видимой колонки. */
	canHide: (columnId: string) => boolean;
	columnMenuLabels: Accessor<GridColumnMenuLabels>;
	/** Строки итогов в порядке «страница, выборка»; пусто, если ни `pageTotals`, ни `totals` не переданы. */
	totalsRows: Accessor<readonly TotalsRow[]>;
	/** Ref шапки: Grid измеряет её высоту. */
	headerRef: (element: HTMLTableSectionElement) => void;
}

export const GridContext = createContext<GridContextValue<unknown>>();

/** Части грида не знают тип строки: для них это `unknown`, типизированные колбэки колонок вызывает корень. */
export function useGrid(): GridContextValue<unknown> {
	const value = useContext(GridContext);
	if (value === undefined) {
		throw new Error('[solid-kit] Grid parts must be rendered inside <Grid>.');
	}
	return value;
}
