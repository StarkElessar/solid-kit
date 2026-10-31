import type { JSX } from 'solid-js';

import type { GridColumn } from './grid-column';
import type { RowKey } from './row-key';

/** Пропсы Grid, добавленные по частям этапа 4а: часть 2 это данные, колонки, ширины и виртуализация. */
export interface GridProps<T> {
	rows: readonly T[];
	/** Уникальный и стабильный между загрузками ключ строки. */
	getRowKey: (row: T) => RowKey;
	columns: readonly GridColumn<T>[];
	/** Колонка чекбоксов: первая, всегда закреплённая; клик по строке переключает выбор. */
	selectable?: boolean | undefined;
	columnWidths?: Readonly<Record<string, number>> | undefined;
	defaultColumnWidths?: Readonly<Record<string, number>> | undefined;
	/** Один раз по окончании ресайза; в аргументе полный словарь переопределённых ширин. */
	onColumnWidthsChange?: ((widths: Readonly<Record<string, number>>) => void) | undefined;
	/** Стартовая оценка высоты строки, px; по умолчанию высота контрола. */
	rowHeight?: number | undefined;
	/** Сколько строк рендерить за пределами видимой области (12). */
	overscan?: number | undefined;
	/** `false` рендерит все строки подряд (читается один раз). */
	virtualized?: boolean | undefined;
	'aria-label'?: string | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
