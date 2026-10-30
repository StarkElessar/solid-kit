import { cleanup, render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCloseOnViewportChange } from './create-close-on-viewport-change';

afterEach(cleanup);

function mount(initiallyOpen = true) {
	const onClose = vi.fn();
	const [open, setOpen] = createSignal(initiallyOpen);
	render(() => {
		createCloseOnViewportChange({ open, onClose });
		return <div data-s-kit-menu><span data-testid='inside'/></div>;
	});
	return { onClose, setOpen };
}

describe('createCloseOnViewportChange', () => {
	it('closes on a scroll of the page or of any element outside the menu', () => {
		const { onClose } = mount();
		document.dispatchEvent(new Event('scroll'));
		expect(onClose).toHaveBeenCalledTimes(1);
		const outside = document.createElement('div');
		document.body.append(outside);
		outside.dispatchEvent(new Event('scroll'));
		expect(onClose).toHaveBeenCalledTimes(2);
		outside.remove();
	});

	it('does not close on a scroll inside a menu', () => {
		const { onClose } = mount();
		document.querySelector('[data-testid="inside"]')?.dispatchEvent(new Event('scroll'));
		expect(onClose).not.toHaveBeenCalled();
	});

	it('closes on a window resize', () => {
		const { onClose } = mount();
		window.dispatchEvent(new Event('resize'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('listens only while open', () => {
		const { onClose, setOpen } = mount(false);
		document.dispatchEvent(new Event('scroll'));
		expect(onClose).not.toHaveBeenCalled();
		setOpen(true);
		window.dispatchEvent(new Event('resize'));
		expect(onClose).toHaveBeenCalledTimes(1);
		setOpen(false);
		window.dispatchEvent(new Event('resize'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
