import type { JSX } from 'solid-js';

/**
 * Атрибуты ячейки `<td>` от потребителя (аналог `HtmlAttributes` колонки Kendo Grid): класс, стиль и `data-*`.
 * `class` добавляется к классу кита, `style` сливается со стилем кита; служебные атрибуты и переменные кита
 * (`data-sticky`, `data-align`, смещение закреплённой колонки, высота ячейки) потребитель не перебивает.
 */
export interface GridCellAttributes {
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	[dataAttribute: `data-${string}`]: string | undefined;
}
