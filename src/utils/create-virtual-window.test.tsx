import { createRoot, createSignal } from 'solid-js';
import { afterEach, describe, expect, it } from 'vitest';

import { createVirtualWindow } from './create-virtual-window';

// В jsdom нет раскладки: высоту окна виртуализатору даёт clientHeight скроллера, предел прокрутки scrollHeight, а scrollTo не реализован.
function makeScroller(height: number): HTMLElement {
	const scroller = document.createElement('div');
	Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: height });
	Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 200 });
	Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 20000 });
	scroller.scrollTo = ((options: ScrollToOptions) => {
		scroller.scrollTop = options.top ?? 0;
	}) as typeof scroller.scrollTo;
	document.body.append(scroller);
	return scroller;
}

describe('createVirtualWindow', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it('рендерит строки видимой области плюс overscan и считает общую высоту', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const window = createVirtualWindow({ count: () => 1000, scroller: () => scroller, estimateSize: () => 20, overscan: 2 });
			expect(window.items().map((item) => item.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
			expect(window.items()[1]).toMatchObject({ index: 1, start: 20, size: 20 });
			expect(window.totalSize()).toBe(20000);
			dispose();
		});
	});

	it('реагирует на смену count', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const [count, setCount] = createSignal(1000);
			const window = createVirtualWindow({ count, scroller: () => scroller, estimateSize: () => 20, overscan: 2 });
			setCount(3);
			expect(window.items().map((item) => item.index)).toEqual([0, 1, 2]);
			expect(window.totalSize()).toBe(60);
			dispose();
		});
	});

	it('пока скроллера нет, окно строится по initialHeight; со скроллером переходит на его высоту', () => {
		createRoot((dispose) => {
			const [scroller, setScroller] = createSignal<HTMLElement | undefined>(undefined);
			const window = createVirtualWindow({
				count: () => 1000,
				scroller,
				estimateSize: () => 20,
				overscan: 0,
				initialHeight: () => 60
			});
			expect(window.items().map((item) => item.index)).toEqual([0, 1, 2]);
			setScroller(makeScroller(100));
			expect(window.items()).toHaveLength(5);
			dispose();
		});
	});

	// onMount виртуализатора выполняется после выхода из createRoot: прокрутку вызываем уже после него
	function mountWindow(scrollPaddingStart?: number, scrollPaddingEnd?: number) {
		return createRoot((dispose) => {
			const scroller = makeScroller(100);
			const window = createVirtualWindow({
				count: () => 1000,
				scroller: () => scroller,
				estimateSize: () => 20,
				overscan: 0,
				...(scrollPaddingStart === undefined ? {} : { scrollPaddingStart: () => scrollPaddingStart }),
				...(scrollPaddingEnd === undefined ? {} : { scrollPaddingEnd: () => scrollPaddingEnd })
			});
			return { window, scroller, dispose };
		});
	}

	it('scrollToIndex передаёт выравнивание виртуализатору', () => {
		const { window, scroller, dispose } = mountWindow();
		window.scrollToIndex(50, { align: 'start' });
		expect(scroller.scrollTop).toBe(1000);
		dispose();
	});

	it('scrollPaddingStart сдвигает выравнивание start на высоту липкого заголовка', () => {
		const { window, scroller, dispose } = mountWindow(28);
		window.scrollToIndex(50, { align: 'start' });
		expect(scroller.scrollTop).toBe(972);
		dispose();
	});

	it('scrollPaddingEnd оставляет место под нижний padding скроллера при выравнивании end', () => {
		const { window, scroller, dispose } = mountWindow(undefined, 4);
		window.scrollToIndex(50, { align: 'end' });
		expect(scroller.scrollTop).toBe(924);
		dispose();
	});

	it('scrollMargin: start и totalSize отсчитываются от начала списка, а не скроллера', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const window = createVirtualWindow({
				count: () => 1000,
				scroller: () => scroller,
				estimateSize: () => 20,
				overscan: 0,
				scrollMargin: () => 60
			});
			// шапка 60 px занимает часть окна: видны строки списка с 0 по 1 (20 + 20 = 40 px после шапки)
			expect(window.items().map((item) => item.index)).toEqual([0, 1]);
			expect(window.items()[0]).toMatchObject({ index: 0, start: 0, size: 20 });
			expect(window.items()[1]).toMatchObject({ index: 1, start: 20, size: 20 });
			expect(window.totalSize()).toBe(20000);
			dispose();
		});
	});

	it('scrollMargin: прокрутка на высоту шапки начинает список с нулевого смещения', () => {
		createRoot((dispose) => {
			const scroller = makeScroller(100);
			const window = createVirtualWindow({
				count: () => 1000,
				scroller: () => scroller,
				estimateSize: () => 20,
				overscan: 0,
				scrollMargin: () => 60
			});
			scroller.scrollTop = 60;
			scroller.dispatchEvent(new Event('scroll'));
			expect(window.items()[0]).toMatchObject({ index: 0, start: 0 });
			expect(window.items()).toHaveLength(5);
			dispose();
		});
	});
});
