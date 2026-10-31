import type { ColumnLayout } from './column-layout';

/** Сумма ширин колонок: `min-inline-size` таблицы. */
export const TABLE_WIDTH_VAR = '--s-kit-grid-table-w';

/** Ширина колонки `index` (читает `<col>`). */
export function widthVar(index: number): string {
	return `--s-kit-grid-w-${index}`;
}

/** Смещение закреплённой колонки `index` (читает `inset-inline-start` её ячеек). */
export function leftVar(index: number): string {
	return `--s-kit-grid-left-${index}`;
}

/**
 * CSS-переменные раскладки. Часть 2 кладёт их в `style` таблицы, а ресайз пересчитывает раскладку и пишет те же переменные прямо в DOM,
 * не трогая состояние Solid (раздел 4.2 спека).
 */
export function layoutCssVars<T>(layout: ColumnLayout<T>): Readonly<Record<string, string>> {
	const vars: Record<string, string> = { [TABLE_WIDTH_VAR]: `${layout.tableWidth}px` };
	for (const item of layout.columns) {
		vars[widthVar(item.index)] = `${item.width}px`;
		if (item.sticky) {
			vars[leftVar(item.index)] = `${item.left}px`;
		}
	}
	return vars;
}
