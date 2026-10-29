import type { VirtualElement } from '@floating-ui/dom';
import { createRoot, createSignal } from 'solid-js';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAnchoredPosition } from './create-anchored-position';

function pointAnchor(x: number, y: number): VirtualElement {
	return {
		getBoundingClientRect: () => ({ x, y, left: x, top: y, right: x, bottom: y, width: 0, height: 0, toJSON: () => ({}) })
	};
}

// jsdom не считает раскладку: размеры вьюпорта 0, и shift() прижимал бы панель к краю; задаём их вручную
beforeEach(() => {
	Object.defineProperty(document.documentElement, 'clientWidth', { value: 1024, configurable: true });
	Object.defineProperty(document.documentElement, 'clientHeight', { value: 768, configurable: true });
});

describe('createAnchoredPosition', () => {
	it('places the floating element under the anchor with the default offset and fixed strategy', async () => {
		const floating = document.createElement('div');
		document.body.append(floating);
		const [open, setOpen] = createSignal(false);
		// эффекты Solid выполняются после выхода из тела createRoot, поэтому сигнал переключается снаружи
		const dispose = createRoot((disposeRoot) => {
			createAnchoredPosition({ anchor: () => pointAnchor(100, 100), floating: () => floating, open });
			return disposeRoot;
		});
		setOpen(true);
		await expect.poll(() => floating.style.left).toBe('100px');
		expect(floating.style.top).toBe('104px');
		expect(floating.style.position).toBe('fixed');
		expect(floating.style.maxHeight).toMatch(/^\d+(\.\d+)?px$/);
		dispose();
		floating.remove();
	});

	it('does not write styles while closed', async () => {
		const floating = document.createElement('div');
		document.body.append(floating);
		createRoot((dispose) => {
			createAnchoredPosition({ anchor: () => pointAnchor(10, 10), floating: () => floating, open: () => false });
			dispose();
		});
		await Promise.resolve();
		expect(floating.style.left).toBe('');
		floating.remove();
	});

	it('does not write styles after the owner is disposed', async () => {
		const floating = document.createElement('div');
		document.body.append(floating);
		createRoot((dispose) => {
			createAnchoredPosition({ anchor: () => pointAnchor(10, 10), floating: () => floating, open: () => true });
			dispose();
		});
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(floating.style.left).toBe('');
		floating.remove();
	});
});
