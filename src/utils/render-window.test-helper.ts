import { type Accessor, createMemo, createSignal } from 'solid-js';

import type { RenderWindow, RenderWindowItem, ScrollAlign } from './render-window';

export interface TestWindowOptions {
	count: Accessor<number>;
	/** Высота каждой строки, px; по умолчанию 20. */
	size?: number;
	/** Высота окна, px. */
	windowHeight: number;
	overscan?: number;
}

export interface TestWindow extends RenderWindow {
	offset: Accessor<number>;
	/** Ручная прокрутка: смещение ограничено высотой списка. */
	scrollTo: (offset: number) => void;
	/** Журнал вызовов `scrollToIndex`. */
	calls: { index: number; align: ScrollAlign | undefined }[];
}

/**
 * Только для тестов: окно рендера с известной геометрией. В jsdom нет раскладки, поэтому виртуализатор там ничего не покажет:
 * ListBox проверяется на этом адаптере. Реальную геометрию (переменные высоты, sticky) проверяет только браузер.
 */
export function createTestWindow(options: TestWindowOptions): TestWindow {
	const size = options.size ?? 20;
	const overscan = options.overscan ?? 0;
	const [offset, setOffset] = createSignal(0);
	const totalSize = createMemo(() => options.count() * size);
	const clamp = (value: number) => Math.min(Math.max(value, 0), Math.max(totalSize() - options.windowHeight, 0));
	const calls: TestWindow['calls'] = [];

	const items = createMemo<readonly RenderWindowItem[]>(() => {
		const count = options.count();
		if (count === 0) {
			return [];
		}
		const first = Math.max(Math.floor(offset() / size) - overscan, 0);
		const last = Math.min(Math.ceil((offset() + options.windowHeight) / size) - 1 + overscan, count - 1);
		const result: RenderWindowItem[] = [];
		for (let index = first; index <= last; index++) {
			result.push({ index, start: index * size, size });
		}
		return result;
	});

	return {
		items,
		totalSize,
		offset,
		calls,
		measure: () => undefined,
		scrollTo: (value) => setOffset(clamp(value)),
		scrollToIndex: (index, scrollOptions) => {
			const align = scrollOptions?.align;
			calls.push({ index, align });
			const start = index * size;
			const end = start + size;
			if (align === 'start') {
				setOffset(clamp(start));
			}
			else if (align === 'center') {
				setOffset(clamp(start - (options.windowHeight - size) / 2));
			}
			else if (align === 'end') {
				setOffset(clamp(end - options.windowHeight));
			}
			else if (start < offset()) {
				setOffset(clamp(start));
			}
			else if (end > offset() + options.windowHeight) {
				setOffset(clamp(end - options.windowHeight));
			}
		}
	};
}
