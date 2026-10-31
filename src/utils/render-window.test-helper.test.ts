import { createRoot, createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';

import { createTestWindow } from './render-window.test-helper';

function setup(count: number, extra: { size?: number; windowHeight?: number; overscan?: number } = {}) {
	return createRoot((dispose) => {
		const [get, set] = createSignal(count);
		const window = createTestWindow({ count: get, size: 20, windowHeight: 100, overscan: 0, ...extra });
		return { window, setCount: set, dispose };
	});
}

describe('createTestWindow', () => {
	it('показывает строки, попадающие в окно, и общую высоту', () => {
		const { window, dispose } = setup(1000);
		expect(window.items().map((item) => item.index)).toEqual([0, 1, 2, 3, 4]);
		expect(window.items()[2]).toEqual({ index: 2, start: 40, size: 20 });
		expect(window.totalSize()).toBe(20000);
		dispose();
	});

	it('overscan добавляет строки по краям, не выходя за пределы списка', () => {
		const { window, dispose } = setup(1000, { overscan: 2 });
		expect(window.items().map((item) => item.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
		window.scrollTo(200);
		expect(window.items()[0]?.index).toBe(8);
		dispose();
	});

	it('scrollTo сдвигает окно, смещение ограничено высотой списка', () => {
		const { window, dispose } = setup(10);
		window.scrollTo(60);
		expect(window.items().map((item) => item.index)).toEqual([3, 4, 5, 6, 7]);
		window.scrollTo(99999);
		expect(window.offset()).toBe(100);
		window.scrollTo(-5);
		expect(window.offset()).toBe(0);
		dispose();
	});

	it('scrollToIndex: auto не двигает видимую строку, выводит невидимую к ближнему краю', () => {
		const { window, dispose } = setup(100);
		window.scrollToIndex(2);
		expect(window.offset()).toBe(0);
		window.scrollToIndex(10);
		// нижний край строки 10 = 220, окно 100
		expect(window.offset()).toBe(120);
		window.scrollToIndex(1);
		expect(window.offset()).toBe(20);
		dispose();
	});

	it('scrollToIndex: start, center, end и журнал вызовов', () => {
		const { window, dispose } = setup(100);
		window.scrollToIndex(10, { align: 'start' });
		expect(window.offset()).toBe(200);
		window.scrollToIndex(10, { align: 'center' });
		expect(window.offset()).toBe(160);
		window.scrollToIndex(10, { align: 'end' });
		expect(window.offset()).toBe(120);
		expect(window.calls).toEqual([
			{ index: 10, align: 'start' },
			{ index: 10, align: 'center' },
			{ index: 10, align: 'end' }
		]);
		dispose();
	});

	it('реагирует на смену count; measure ничего не делает', () => {
		const { window, setCount, dispose } = setup(1000);
		setCount(3);
		expect(window.items().map((item) => item.index)).toEqual([0, 1, 2]);
		expect(window.totalSize()).toBe(60);
		expect(() => {
			window.measure(document.createElement('div'));
		}).not.toThrow();
		dispose();
	});
});
