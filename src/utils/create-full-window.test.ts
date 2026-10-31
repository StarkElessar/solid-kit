import { createRoot, createSignal } from 'solid-js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { createFullWindow } from './create-full-window';

function setup(count: number, scrollPaddingStart?: number, scrollPaddingEnd?: number) {
	return createRoot((dispose) => {
		const scroller = document.createElement('div');
		for (let index = 0; index < 5; index++) {
			const row = document.createElement('div');
			row.dataset['index'] = String(index);
			scroller.append(row);
		}
		const [get, set] = createSignal(count);
		const window = createFullWindow({
			count: get,
			scroller: () => scroller,
			estimateSize: () => 30,
			overscan: 6,
			...(scrollPaddingStart === undefined ? {} : { scrollPaddingStart: () => scrollPaddingStart }),
			...(scrollPaddingEnd === undefined ? {} : { scrollPaddingEnd: () => scrollPaddingEnd })
		});
		return { window, scroller, setCount: set, dispose };
	});
}

describe('createFullWindow', () => {
	let scrollIntoView: Mock<(options: ScrollIntoViewOptions) => void>;

	beforeEach(() => {
		// jsdom не реализует scrollIntoView
		scrollIntoView = vi.fn<(options: ScrollIntoViewOptions) => void>();
		Element.prototype.scrollIntoView = scrollIntoView;
	});

	it('items содержит все строки с накопленным смещением, totalSize это их сумма', () => {
		const { window, dispose } = setup(4);
		expect(window.items()).toEqual([
			{ index: 0, start: 0, size: 30 },
			{ index: 1, start: 30, size: 30 },
			{ index: 2, start: 60, size: 30 },
			{ index: 3, start: 90, size: 30 }
		]);
		expect(window.totalSize()).toBe(120);
		dispose();
	});

	it('реагирует на смену count', () => {
		const { window, setCount, dispose } = setup(4);
		setCount(2);
		expect(window.items()).toHaveLength(2);
		expect(window.totalSize()).toBe(60);
		dispose();
	});

	it('пустой список: totalSize равен нулю', () => {
		const { window, dispose } = setup(0);
		expect(window.items()).toEqual([]);
		expect(window.totalSize()).toBe(0);
		dispose();
	});

	it('measure ничего не делает', () => {
		const { window, dispose } = setup(1);
		expect(() => {
			window.measure(document.createElement('div'));
		}).not.toThrow();
		dispose();
	});

	it('scrollToIndex ближайшим краем (auto) через scrollIntoView строки с data-index', () => {
		const { window, scroller, dispose } = setup(5);
		window.scrollToIndex(3);
		expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: 'nearest' });
		expect(scrollIntoView.mock.contexts[0]).toBe(scroller.querySelector('[data-index="3"]'));
		dispose();
	});

	it('align start, center, end переводятся в block', () => {
		const { window, dispose } = setup(5);
		window.scrollToIndex(1, { align: 'start' });
		window.scrollToIndex(1, { align: 'center' });
		window.scrollToIndex(1, { align: 'end' });
		expect(scrollIntoView.mock.calls.map(([arg]) => arg)).toEqual([{ block: 'start' }, { block: 'center' }, { block: 'end' }]);
		dispose();
	});

	it('scrollPaddingStart записывается в scroll-padding-top скроллера перед прокруткой', () => {
		const { window, scroller, dispose } = setup(5, 28);
		window.scrollToIndex(2);
		expect(scroller.style.scrollPaddingTop).toBe('28px');
		dispose();
	});

	it('scrollPaddingEnd записывается в scroll-padding-bottom скроллера перед прокруткой', () => {
		const { window, scroller, dispose } = setup(5, 0, 4);
		window.scrollToIndex(2);
		expect(scroller.style.scrollPaddingBottom).toBe('4px');
		dispose();
	});

	it('нет строки с таким data-index: ничего не происходит', () => {
		const { window, dispose } = setup(5);
		window.scrollToIndex(99);
		expect(scrollIntoView).not.toHaveBeenCalled();
		dispose();
	});
});
