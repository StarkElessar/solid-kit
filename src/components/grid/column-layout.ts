import { clampColumnWidth, DEFAULT_COLUMN_WIDTH } from './clamp-column-width';
import type { GridColumn } from './grid-column';

export interface LayoutColumn<T> {
	readonly column: GridColumn<T>;
	/** Индекс среди видимых упорядоченных колонок без колонки чекбоксов: по нему называются CSS-переменные. */
	readonly index: number;
	/** Итоговая ширина, px. */
	readonly width: number;
	/** Закреплена слева (`position: sticky`). */
	readonly sticky: boolean;
	/** Смещение sticky-колонки от левого края с учётом колонки чекбоксов; у обычных колонок 0. */
	readonly left: number;
}

export interface ColumnLayout<T> {
	readonly columns: readonly LayoutColumn<T>[];
	/** Ширина колонки чекбоксов, 0 если её нет. */
	readonly selectWidth: number;
	/** Сумма ширин колонок плюс колонка чекбоксов. */
	readonly tableWidth: number;
	/** Колонка чекбоксов плюс все закреплённые: на столько прокручиваемая область начинается правее левого края. */
	readonly stickyWidth: number;
}

export interface ColumnLayoutOptions {
	selectable: boolean;
	selectWidth: number;
}

/**
 * Раскладка видимых колонок: закреплённые идут первыми (внутри групп порядок массива), скрытые пропускаются. Ширина колонки: значение
 * из `widths`, иначе `column.width`, иначе 160, но в пределах `minWidth`…`maxWidth`. Единственный источник чисел для `<col>`,
 * sticky-смещений и ширины таблицы (раздел 4.2 спека этапа 4а).
 */
export function computeColumnLayout<T>(
	columns: readonly GridColumn<T>[],
	widths: Readonly<Record<string, number>>,
	options: ColumnLayoutOptions
): ColumnLayout<T> {
	const visible = columns.filter((column) => column.hidden !== true);
	const ordered = [...visible.filter((column) => column.locked === true), ...visible.filter((column) => column.locked !== true)];
	const selectWidth = options.selectable ? options.selectWidth : 0;

	let left = selectWidth;
	let total = selectWidth;
	const result: LayoutColumn<T>[] = ordered.map((column, index) => {
		const width = clampColumnWidth(widths[column.id] ?? column.width ?? DEFAULT_COLUMN_WIDTH, column.minWidth, column.maxWidth);
		const sticky = column.locked === true;
		const item: LayoutColumn<T> = { column, index, width, sticky, left: sticky ? left : 0 };
		if (sticky) {
			left += width;
		}
		total += width;
		return item;
	});
	return { columns: result, selectWidth, tableWidth: total, stickyWidth: left };
}
