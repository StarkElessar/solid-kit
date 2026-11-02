import type { JSX } from 'solid-js';

import type { GridGroupDirection } from './grid-group-sort';

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
	/** Закреплена слева. Начальное значение: текущее состояние это `lockedColumns` грида. */
	locked?: boolean | undefined;
	/** Скрыта. Начальное значение: текущее состояние это `hiddenColumns` грида. */
	hidden?: boolean | undefined;
	sortable?: boolean | undefined;
	/** Формат итога колонки (глобального и группового); без него значение показывается как текст ячейки. */
	aggregate?: ((value: unknown) => JSX.Element) | undefined;
	/** Можно ли группировать по колонке (по умолчанию да, если у грида `groupable`). */
	groupable?: boolean | undefined;
	/** Как показать значение группы в заголовке; без него значение форматируется как текст ячейки. */
	groupValue?: ((value: unknown) => JSX.Element) | undefined;
	/** Начальный порядок групп колонки (по умолчанию по возрастанию); меняется кликом по чипу. */
	groupSortDirection?: GridGroupDirection | undefined;
}
