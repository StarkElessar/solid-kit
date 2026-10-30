import { cleanup, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FloatingPanel } from './floating-panel';

beforeEach(() => {
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

describe('FloatingPanel focus options', () => {
	it('calls a function initialFocus with the shown panel instead of the built-in modes', () => {
		const focus = vi.fn();
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		render(() => (
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<FloatingPanel open={() => true} onDismiss={() => undefined} anchor={anchor} initialFocus={focus} data-testid='panel'>
					<button type='button'>inside</button>
				</FloatingPanel>
			</>
		));
		expect(focus).toHaveBeenCalledExactlyOnceWith(screen.getByTestId('panel'));
		expect(document.activeElement).not.toBe(screen.getByText('inside'));
	});

	it('returns the focus to restoreFocusTo instead of the anchor when the panel closes', () => {
		const [open, setOpen] = createSignal(true);
		const [anchor, setAnchor] = createSignal<HTMLElement>();
		const [target, setTarget] = createSignal<HTMLElement>();
		render(() => (
			<>
				<button type='button' ref={setAnchor}>anchor</button>
				<button type='button' ref={setTarget}>target</button>
				<FloatingPanel open={open} onDismiss={() => undefined} anchor={anchor} restoreFocusTo={target}>
					<button type='button'>inside</button>
				</FloatingPanel>
			</>
		));
		expect(document.activeElement).toBe(screen.getByText('inside'));
		setOpen(false);
		expect(document.activeElement).toBe(screen.getByText('target'));
	});
});
