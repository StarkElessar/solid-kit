import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { useContext } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Probe } from './probe';
import { ProbeScope } from './probe-scope';

beforeEach(() => {
	// jsdom не реализует Popover API
	HTMLElement.prototype.showPopover = vi.fn();
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

function Scope() {
	return <span data-testid='scope'>{useContext(ProbeScope).label}</span>;
}

describe('Probe', () => {
	it('is closed by default and toggles on click (uncontrolled)', () => {
		render(() => <Probe>content</Probe>);
		const button = screen.getByRole('button');
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByText('content')).toBeNull();
		fireEvent.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.click(button);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('controlled: click only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => <Probe open={false} onOpenChange={onOpenChange}>content</Probe>);
		fireEvent.click(screen.getByRole('button'));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('defaultOpen starts open', () => {
		render(() => <Probe defaultOpen>content</Probe>);
		expect(screen.getByText('content')).toBeTruthy();
	});

	it('Escape closes the open panel', () => {
		render(() => <Probe defaultOpen>content</Probe>);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByText('content')).toBeNull();
	});

	it('a click outside closes the panel, a click on the trigger does not close it by itself', () => {
		render(() => <Probe defaultOpen>content</Probe>);
		fireEvent.pointerDown(screen.getByRole('button'));
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.pointerDown(document.body);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('exposes the kit scope to the panel content through the shared context', () => {
		render(() => (
			<Probe defaultOpen>
				<Scope/>
			</Probe>
		));
		expect(screen.getByTestId('scope').textContent).toBe('probe-scope');
	});

	it('puts data-s-kit and the size attribute on the roots', () => {
		render(() => (
			<Probe defaultOpen size='lg'>
				content
			</Probe>
		));
		const button = screen.getByRole('button');
		expect(button.hasAttribute('data-s-kit')).toBe(true);
		expect(button.getAttribute('data-s-kit-size')).toBe('lg');
		expect(document.querySelector('[data-probe-panel]')?.hasAttribute('data-s-kit')).toBe(true);
	});
});
