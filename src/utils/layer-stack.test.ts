import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLayerCount, registerLayer } from './layer-stack';

const unregisters: Array<() => void> = [];

function addLayer(
	contains: (target: Node) => boolean = () => false,
	modal = false
): { close: ReturnType<typeof vi.fn>; unregister: () => void } {
	const close = vi.fn();
	const unregister = registerLayer({ contains, close, modal });
	unregisters.push(unregister);
	return { close, unregister };
}

function pressEscape(): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
	document.body.dispatchEvent(event);
	return event;
}

function pointerDownOn(target: Element): void {
	target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
}

afterEach(() => {
	for (const unregister of unregisters.splice(0)) {
		unregister();
	}
});

describe('layer stack', () => {
	it('Escape closes only the top layer and cancels the default action', () => {
		const lower = addLayer();
		const upper = addLayer();
		const event = pressEscape();
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(true);
	});

	it('after the top layer is unregistered, Escape reaches the layer below', () => {
		const lower = addLayer();
		const upper = addLayer();
		upper.unregister();
		pressEscape();
		expect(lower.close).toHaveBeenCalledOnce();
	});

	it('ignores other keys', () => {
		const layer = addLayer();
		document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		expect(layer.close).not.toHaveBeenCalled();
	});

	it('pointerdown outside the top layer closes it, inside does not; a lower layer holding the target stays open', () => {
		const inside = document.createElement('div');
		const outside = document.createElement('div');
		document.body.append(inside, outside);
		const lower = addLayer((target) => outside.contains(target));
		const upper = addLayer((target) => inside.contains(target));
		pointerDownOn(inside);
		expect(upper.close).not.toHaveBeenCalled();
		pointerDownOn(outside);
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).not.toHaveBeenCalled();
		inside.remove();
		outside.remove();
	});

	it('counts layers and tolerates a repeated unregister', () => {
		expect(getLayerCount()).toBe(0);
		const layer = addLayer();
		expect(getLayerCount()).toBe(1);
		layer.unregister();
		layer.unregister();
		expect(getLayerCount()).toBe(0);
	});

	it('does nothing when the stack is empty', () => {
		const layer = addLayer();
		layer.unregister();
		const event = pressEscape();
		expect(event.defaultPrevented).toBe(false);
		expect(layer.close).not.toHaveBeenCalled();
	});

	it('pointerdown outside every layer closes all of them from the top down', () => {
		const outside = document.createElement('div');
		document.body.append(outside);
		const lower = addLayer();
		const upper = addLayer();
		pointerDownOn(outside);
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).toHaveBeenCalledOnce();
		expect(upper.close.mock.invocationCallOrder[0]).toBeLessThan(lower.close.mock.invocationCallOrder[0] ?? 0);
		outside.remove();
	});

	it('the cascade stops at the first layer that holds the target', () => {
		const inMiddle = document.createElement('div');
		document.body.append(inMiddle);
		const bottom = addLayer();
		const middle = addLayer((target) => inMiddle.contains(target));
		const top = addLayer();
		pointerDownOn(inMiddle);
		expect(top.close).toHaveBeenCalledOnce();
		expect(middle.close).not.toHaveBeenCalled();
		expect(bottom.close).not.toHaveBeenCalled();
		inMiddle.remove();
	});

	it('a modal layer is never closed by the stack and stops the cascade', () => {
		const outside = document.createElement('div');
		document.body.append(outside);
		const bottom = addLayer();
		const modal = addLayer(() => false, true);
		const top = addLayer();
		pointerDownOn(outside);
		expect(top.close).toHaveBeenCalledOnce();
		expect(modal.close).not.toHaveBeenCalled();
		expect(bottom.close).not.toHaveBeenCalled();
		outside.remove();
	});

	it('does not call close() of a lower layer that the upper layer has just unregistered', () => {
		const outside = document.createElement('div');
		document.body.append(outside);
		const lower = addLayer();
		const upper = addLayer();
		upper.close.mockImplementation(() => {
			lower.unregister();
			upper.unregister();
		});
		pointerDownOn(outside);
		expect(upper.close).toHaveBeenCalledOnce();
		expect(lower.close).not.toHaveBeenCalled();
		outside.remove();
	});

	it('survives a layer that unregisters itself while being closed', () => {
		const outside = document.createElement('div');
		document.body.append(outside);
		const lower = addLayer();
		let unregisterUpper = (): void => {};
		const upperClose = vi.fn(() => {
			unregisterUpper();
		});
		unregisterUpper = registerLayer({ contains: () => false, close: upperClose });
		unregisters.push(unregisterUpper);
		pointerDownOn(outside);
		expect(upperClose).toHaveBeenCalledOnce();
		expect(lower.close).toHaveBeenCalledOnce();
		outside.remove();
	});
});
