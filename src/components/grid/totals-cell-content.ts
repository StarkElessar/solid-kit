import type { JSX } from 'solid-js';

import { formatCellValue } from './format-cell-value';
import type { GridColumn } from './grid-column';
import { hasTotalsValue } from './has-totals-value';

/** Содержимое ячейки итога: пусто без значения, иначе `aggregate` колонки или текст ячейки по умолчанию. */
export function totalsCellContent(column: GridColumn<unknown>, values: Readonly<Record<string, unknown>>): JSX.Element {
	if (!hasTotalsValue(column.id, values)) {
		return '';
	}
	return column.aggregate === undefined ? formatCellValue(values[column.id]) : column.aggregate(values[column.id]);
}
