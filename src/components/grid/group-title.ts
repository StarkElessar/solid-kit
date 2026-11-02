import type { GridColumn } from './grid-column';
import type { GridGroup } from './grid-group';
import { groupValueText } from './group-value-text';

/** Текст «Колонка: значение» для `title` и подписей читалок; колонка не найдена — берётся `field` группы. */
export function groupTitle(column: GridColumn<unknown> | undefined, group: GridGroup<unknown>, emptyValue: string): string {
	return `${column?.title ?? group.field}: ${groupValueText(group, emptyValue)}`;
}
