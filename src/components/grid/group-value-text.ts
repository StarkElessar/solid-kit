import { formatCellValue } from './format-cell-value';
import type { GridGroup } from './grid-group';

/** Значение группы текстом; пустое значение заменяется на `emptyValue`. */
export function groupValueText(group: GridGroup<unknown>, emptyValue: string): string {
	const text = formatCellValue(group.value);
	return text === '' ? emptyValue : text;
}
