import { formatCellValue } from './format-cell-value';
import type { GridColumn } from './grid-column';
import type { GridGroup } from './grid-group';

/** Текст «Колонка: значение» для `title` и подписей читалок; колонка не найдена — берётся `field` группы. */
export function groupTitle(column: GridColumn<unknown> | undefined, group: GridGroup<unknown>, emptyValue: string): string {
	const text = formatCellValue(group.value);
	return `${column?.title ?? group.field}: ${text === '' ? emptyValue : text}`;
}
