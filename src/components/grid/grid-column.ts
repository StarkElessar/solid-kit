import type { JSX } from 'solid-js';

export interface GridColumn<T> {
	/** Стабильный ключ колонки. */
	id: string;
	title: string;
	/** Значение ячейки; без `cell` показывается `String(value(row))`. */
	value: (row: T) => unknown;
	cell?: ((row: T) => JSX.Element) | undefined;
	/** Ширина по умолчанию, px (160, если не задана). */
	width?: number | undefined;
	/** Нижняя граница ширины при ресайзе, px (60, если не задана). */
	minWidth?: number | undefined;
	/**
	 * Высота, которую требует колонка (календарь, большой селект), px. Высота строки не меньше этого значения: строка получает максимум
	 * из `rowHeight` грида и `rowHeight` всех видимых колонок, а ячейка колонки получает собственную высоту.
	 */
	rowHeight?: number | undefined;
	/** Верхняя граница ширины, px (без ограничения, если не задана): и в раскладке, и при ресайзе. */
	maxWidth?: number | undefined;
	align?: 'start' | 'end' | 'center' | undefined;
	/** Закреплена слева. В этапе 4а задаётся только пропсами. */
	locked?: boolean | undefined;
	/** Скрыта. В этапе 4а задаётся только пропсами. */
	hidden?: boolean | undefined;
	sortable?: boolean | undefined;
}
