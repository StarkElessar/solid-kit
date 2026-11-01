import type { JSX } from 'solid-js';

import { formatCellValue } from './format-cell-value';
import type { GridColumn } from './grid-column';

/** Содержимое ячейки итога: пусто без значения, иначе `aggregate` колонки или текст ячейки по умолчанию. */
export function totalsCellContent(column: GridColumn<unknown>, values: Readonly<Record<string, unknown>>): JSX.Element {
	// hasOwn: колонка с id вроде `constructor` не должна читать унаследованные ключи
	if (!Object.hasOwn(values, column.id)) {
		return '';
	}
	const value = values[column.id];
	if (value === undefined) {
		return '';
	}
	return column.aggregate === undefined ? formatCellValue(value) : column.aggregate(value);
}
