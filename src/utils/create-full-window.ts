import { createMemo } from 'solid-js';

import type { RenderWindow, RenderWindowItem, RenderWindowOptions, ScrollAlign } from './render-window';

const BLOCK: Record<ScrollAlign, ScrollLogicalPosition> = {
	auto: 'nearest',
	start: 'start',
	center: 'center',
	end: 'end'
};

/**
 * Окно рендера без виртуализации (`virtualized={false}`): `items()` это все строки, измерять нечего. Прокрутка идёт через
 * `scrollIntoView` строки с `data-index`; высота липкого заголовка попадает в `scroll-padding-top` скроллера.
 */
export function createFullWindow(options: RenderWindowOptions): RenderWindow {
	const items = createMemo<readonly RenderWindowItem[]>(() => {
		const result: RenderWindowItem[] = [];
		let start = 0;
		for (let index = 0; index < options.count(); index++) {
			const size = options.estimateSize(index);
			result.push({ index, start, size });
			start += size;
		}
		return result;
	});
	const totalSize = createMemo(() => {
		const all = items();
		const last = all[all.length - 1];
		return last === undefined ? 0 : last.start + last.size;
	});

	return {
		items,
		totalSize,
		measure: () => undefined,
		scrollToIndex: (index, scrollOptions) => {
			const scroller = options.scroller();
			const row = scroller?.querySelector<HTMLElement>(`[data-index="${index}"]`);
			if (scroller === undefined || row === null || row === undefined) {
				return;
			}
			scroller.style.scrollPaddingTop = `${options.scrollPaddingStart?.() ?? 0}px`;
			row.scrollIntoView({ block: BLOCK[scrollOptions?.align ?? 'auto'] });
		}
	};
}
