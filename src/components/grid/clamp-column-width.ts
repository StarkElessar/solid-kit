/** Ширина колонки без явного значения, px. */
export const DEFAULT_COLUMN_WIDTH = 160;

/** Нижняя граница ширины колонки, px (минимум из референса). */
export const DEFAULT_MIN_COLUMN_WIDTH = 60;

/** Приводит ширину колонки к целым px не меньше `minWidth`; нечисло даёт минимум. */
export function clampColumnWidth(width: number, minWidth: number = DEFAULT_MIN_COLUMN_WIDTH): number {
	if (!Number.isFinite(width)) {
		return minWidth;
	}
	return Math.max(Math.round(width), minWidth);
}
