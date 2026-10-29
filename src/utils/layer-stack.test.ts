import { afterEach, describe, expect, it, vi } from 'vitest';

import { getLayerCount, registerLayer } from './layer-stack';

const unregisters: Array<() => void> = [];

function addLayer(contains: (target: Node) => boolean = () => false): { close: () => void; unregister: () => void } {
	const close = vi.fn();
	const unregister = registerLayer({ contains, close });
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

	it('pointerdown outside the top layer closes it, inside does not', () => {
		const inside = document.createElement('div');
		const outside = document.createElement('div');
		document.body.append(inside, outside);
		const lower = addLayer();
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
});
