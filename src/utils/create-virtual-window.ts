import { createVirtualizer } from '@tanstack/solid-virtual';

import type { RenderWindow, RenderWindowOptions } from './render-window';

/**
 * Окно рендера на TanStack Virtual. Опции передаются геттерами, поэтому смена `count`, скроллера, `scrollPaddingStart`
 * и `initialHeight` подхватывается реактивно. Пункты рендерятся в обычном потоке между двумя spacer-элементами
 * (раздел 6 зонтичного); строкам нужен `data-index` и `ref={window.measure}` для точных высот.
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
		get scrollPaddingStart() {
			return options.scrollPaddingStart?.() ?? 0;
		},
		get initialRect() {
			return { width: 0, height: options.initialHeight?.() ?? 0 };
		}
	});

	return {
		items: () => virtualizer.getVirtualItems(),
		totalSize: () => virtualizer.getTotalSize(),
		measure: (element) => {
			virtualizer.measureElement(element);
		},
		scrollToIndex: (index, scrollOptions) => {
			virtualizer.scrollToIndex(index, scrollOptions?.align === undefined ? undefined : { align: scrollOptions.align });
		}
	};
}
