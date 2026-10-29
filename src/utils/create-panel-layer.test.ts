import { createRoot, createSignal } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPanelLayer } from './create-panel-layer';
import { getLayerCount } from './layer-stack';

// jsdom не реализует Popover API
const showPopover = vi.fn();
const hidePopover = vi.fn();

beforeEach(() => {
	showPopover.mockReset();
	hidePopover.mockReset();
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = hidePopover;
});

function mount() {
	const panel = document.createElement('div');
	const anchor = document.createElement('button');
	document.body.append(panel, anchor);
	const onDismiss = vi.fn();
	const [open, setOpen] = createSignal(false);
	// эффекты Solid выполняются после выхода из тела createRoot, поэтому сигналы переключаются снаружи
	const dispose = createRoot((disposeRoot) => {
		createPanelLayer({ open, panel: () => panel, anchor: () => anchor, onDismiss });
		return disposeRoot;
	});
	return { panel, anchor, onDismiss, setOpen, dispose };
}

describe('createPanelLayer', () => {
	it('shows the panel in the top layer and registers a layer while open', () => {
		const { panel, setOpen, dispose } = mount();
		expect(showPopover).not.toHaveBeenCalled();
		setOpen(true);
		expect(panel.getAttribute('popover')).toBe('manual');
		expect(showPopover).toHaveBeenCalledOnce();
		expect(getLayerCount()).toBe(1);
		dispose();
	});

	it('hides the panel and unregisters the layer on close', () => {
		const { setOpen, dispose } = mount();
		setOpen(true);
		setOpen(false);
		expect(hidePopover).toHaveBeenCalledOnce();
		expect(getLayerCount()).toBe(0);
		dispose();
	});

	it('unregisters the layer when the owner is disposed', () => {
		const { setOpen, dispose } = mount();
		setOpen(true);
		dispose();
		expect(getLayerCount()).toBe(0);
	});

	it('requests dismiss on Escape and on a pointerdown outside, not on the panel or the anchor', () => {
		const { panel, anchor, onDismiss, setOpen, dispose } = mount();
		setOpen(true);
		panel.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
		anchor.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
		expect(onDismiss).not.toHaveBeenCalled();
		document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
		expect(onDismiss).toHaveBeenCalledTimes(1);
		document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
		expect(onDismiss).toHaveBeenCalledTimes(2);
		dispose();
	});

	it('does nothing without a panel element', () => {
		createRoot((dispose) => {
			const [open] = createSignal(true);
			createPanelLayer({ open, panel: () => undefined, anchor: () => undefined, onDismiss: vi.fn() });
			expect(showPopover).not.toHaveBeenCalled();
			expect(getLayerCount()).toBe(0);
			dispose();
		});
	});

	it('does not throw when the panel is already detached on cleanup', () => {
		const { panel, setOpen, dispose } = mount();
		setOpen(true);
		panel.remove();
		expect(() => {
			setOpen(false);
		}).not.toThrow();
		expect(hidePopover).not.toHaveBeenCalled();
		dispose();
	});
});
