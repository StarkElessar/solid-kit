import { type Accessor, createContext, useContext } from 'solid-js';

import type { RenderWindow } from '../../utils/render-window';

import type { RowIndex } from './build-row-index';
import type { ColumnLayout } from './column-layout';
import type { GridColumn } from './grid-column';

export interface GridContextValue<T> {
	rows: Accessor<readonly T[]>;
	rowIndex: Accessor<RowIndex>;
	layout: Accessor<ColumnLayout<T>>;
	/** Видимые колонки в порядке показа. Список не пересоздаётся при смене ширин: шапка и ячейки живут между ресайзами. */
	columns: Accessor<readonly GridColumn<T>[]>;
	/** Индекс последней закреплённой колонки (правый разделитель закрепа), -1 если закреплённых нет. */
	lastStickyIndex: Accessor<number>;
	window: RenderWindow;
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
