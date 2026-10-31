import { type Accessor, onCleanup } from 'solid-js';

import { DEFAULT_MIN_COLUMN_WIDTH } from './clamp-column-width';
import { layoutCssVars } from './column-css-vars';
import { type ColumnLayout, type ColumnLayoutOptions, computeColumnLayout } from './column-layout';
import type { GridColumn } from './grid-column';
import { startColumnResize } from './start-column-resize';

type ColumnWidths = Readonly<Record<string, number>>;

export interface GridResizeOptions<T> {
	/** Все колонки из пропсов, включая скрытые. */
	columns: Accessor<readonly GridColumn<T>[]>;
	widths: Accessor<ColumnWidths>;
	/** Пишет ширины в состояние и сообщает наружу; вызывается по окончании перетаскивания и по двойному клику. */
	setWidths: (next: ColumnWidths) => void;
	/** Раскладка из состояния: единственный источник переменных после завершения и отмены. */
	layout: Accessor<ColumnLayout<T>>;
	layoutOptions: Accessor<ColumnLayoutOptions>;
	scroller: Accessor<HTMLElement | undefined>;
}

export interface GridResize {
	/** `pointerdown` на ручке колонки `index` (индекс среди видимых колонок). */
	beginResize: (index: number, event: PointerEvent) => void;
	/** Двойной клик по ручке: ширина колонки возвращается к `GridColumn.width`. */
	resetWidth: (columnId: string) => void;
}

/**
 * Ресайз без перерисовки (спек 4а, раздел 4.2): во время перетаскивания меняются только CSS-переменные таблицы, состояние Solid
 * обновляется один раз на `pointerup`. После завершения и отмены переменные снова берутся из раскладки состояния, поэтому
 * controlled-родитель, не принявший ширину, возвращает прежнюю.
 */
export function createGridResize<T>(options: GridResizeOptions<T>): GridResize {
	let cancelActive: (() => void) | undefined;

	function applyLayout(table: HTMLElement, next: ColumnLayout<T>): void {
		for (const [name, value] of Object.entries(layoutCssVars(next))) {
			table.style.setProperty(name, value);
		}
		options.scroller()?.style.setProperty('scroll-padding-inline-start', `${next.stickyWidth}px`);
	}

	function beginResize(index: number, event: PointerEvent): void {
		const handle = event.currentTarget;
		const item = options.layout().columns[index];
		const table = handle instanceof HTMLElement ? handle.closest('table') : null;
		if (!(handle instanceof HTMLElement) || event.button !== 0 || item === undefined || table === null) {
			return;
		}
		event.preventDefault();
		cancelActive?.();
		const columnId = item.column.id;
		const startWidths = options.widths();
		const finish = (): void => {
			cancelActive = undefined;
		};
		cancelActive = startColumnResize({
			handle,
			pointerId: event.pointerId,
			startX: event.clientX,
			startWidth: item.width,
			minWidth: item.column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
			onMove: (width) => {
				applyLayout(table, computeColumnLayout(options.columns(), { ...startWidths, [columnId]: width }, options.layoutOptions()));
			},
			onCommit: (width) => {
				finish();
				if (width !== item.width) {
					options.setWidths({ ...startWidths, [columnId]: width });
				}
				applyLayout(table, options.layout());
			},
			onCancel: () => {
				finish();
				applyLayout(table, options.layout());
			}
		});
	}

	function resetWidth(columnId: string): void {
		const current = options.widths();
		if (!(columnId in current)) {
			return;
		}
		const { [columnId]: _removed, ...rest } = current;
		options.setWidths(rest);
	}

	onCleanup(() => {
		cancelActive?.();
	});

	return { beginResize, resetWidth };
}
