import { type Accessor, createContext, type JSX, useContext } from 'solid-js';

import type { RenderWindow } from '../../utils/render-window';
import type { ContextMenuPoint } from '../context-menu';
import type { MenuOpenSource } from '../context-menu/context-menu-context';

import type { RowIndex } from './build-row-index';
import type { ColumnLayout } from './column-layout';
import type { GridColumn } from './grid-column';
import type { GridSort } from './grid-sort';
import type { RowMenuTarget } from './row-menu-target';
import type { SelectionState } from './selection-state';

export interface GridContextValue<T> {
	rows: Accessor<readonly T[]>;
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
