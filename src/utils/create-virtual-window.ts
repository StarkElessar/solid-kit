import { createVirtualizer } from '@tanstack/solid-virtual';

import type { RenderWindow, RenderWindowOptions } from './render-window';

/**
 * Окно рендера на TanStack Virtual. Опции передаются геттерами, поэтому смена `count`, скроллера, `scrollPaddingStart`,
 * `scrollPaddingEnd` и `initialHeight` подхватывается реактивно. Пункты рендерятся в обычном потоке между двумя spacer-элементами
 * (раздел 6 зонтичного); строкам нужен `data-index` и вызов `window.measure(element)` из `onMount` для точных высот (`ref` срабатывает
 * раньше атрибутов). `scrollMargin` (шапка грида в том же скроллере) смещает отсчёт видимого диапазона, а `start` строк остаётся
 * отсчётом от начала списка.
 */
export function createVirtualWindow(options: RenderWindowOptions): RenderWindow {
	const virtualizer = createVirtualizer<HTMLElement, HTMLElement>({
		get count() {
			return options.count();
		},
		getScrollElement: () => options.scroller() ?? null,
		estimateSize: (index) => options.estimateSize(index),
		get overscan() {
			return options.overscan;
		},
		get scrollMargin() {
			return options.scrollMargin?.() ?? 0;
		},
		get scrollPaddingStart() {
			return options.scrollPaddingStart?.() ?? 0;
		},
		get scrollPaddingEnd() {
			return options.scrollPaddingEnd?.() ?? 0;
		},
		get initialRect() {
			return { width: 0, height: options.initialHeight?.() ?? 0 };
		}
	});

	return {
		// TanStack отсчитывает `start` от начала скроллера; потребителям нужен отсчёт от начала списка
		items: () => {
			const margin = options.scrollMargin?.() ?? 0;
			const items = virtualizer.getVirtualItems();
			return margin === 0 ? items : items.map((item) => ({ index: item.index, start: item.start - margin, size: item.size }));
		},
		totalSize: () => virtualizer.getTotalSize(),
		measure: (element) => {
			virtualizer.measureElement(element);
		},
		scrollToIndex: (index, scrollOptions) => {
			virtualizer.scrollToIndex(index, scrollOptions?.align === undefined ? undefined : { align: scrollOptions.align });
		}
	};
}
