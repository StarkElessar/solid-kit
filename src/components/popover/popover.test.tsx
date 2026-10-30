import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Popover, usePopover } from './index';

beforeEach(() => {
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

function CloseButton() {
	const popover = usePopover();
	return <button type='button' onClick={popover.close}>close-hook</button>;
}

describe('Popover', () => {
	it('is closed by default and toggles on the trigger click (uncontrolled), wiring aria-expanded and aria-controls', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByText('content')).toBeNull();
		fireEvent.click(trigger);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		const panel = screen.getByText('content');
		expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
		expect(trigger.hasAttribute('data-popover-open')).toBe(true);
		fireEvent.click(trigger);
		expect(screen.queryByText('content')).toBeNull();
		expect(trigger.hasAttribute('data-popover-open')).toBe(false);
	});

	it('controlled: the trigger click only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Popover.Root open={false} onOpenChange={onOpenChange}>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('defaultOpen starts open and onOpenChange reports the closing', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Popover.Root defaultOpen onOpenChange={onOpenChange}>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('a click outside closes it, a pointerdown on the trigger does not close it by itself', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		fireEvent.pointerDown(screen.getByRole('button', { name: 'Open' }));
		expect(screen.getByText('content')).toBeTruthy();
		fireEvent.pointerDown(document.body);
		expect(screen.queryByText('content')).toBeNull();
	});

	it('moves the focus into the panel on open and returns it to the trigger on Escape', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>
					<button type='button'>inside</button>
				</Popover.Content>
			</Popover.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		fireEvent.click(trigger);
		expect(document.activeElement).toBe(screen.getByRole('button', { name: 'inside' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.activeElement).toBe(trigger);
	});

	it('a custom trigger through render receives the attributes and ref', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger render={(attributes) => <span {...attributes} data-testid='custom' role='button'>custom</span>}/>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		const custom = screen.getByTestId('custom');
		expect(custom.getAttribute('aria-expanded')).toBe('false');
		fireEvent.click(custom);
		expect(custom.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByText('content')).toBeTruthy();
	});

	it('the public ref of Popover.Trigger still receives the button', () => {
		const onRef = vi.fn();
		render(() => (
			<Popover.Root>
				<Popover.Trigger ref={onRef}>Open</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		expect(onRef).toHaveBeenCalledExactlyOnceWith(screen.getByRole('button', { name: 'Open' }));
	});

	it('Popover.Content accepts onKeyDown and ref, and onKeyDown still runs before the isolation', () => {
		const onKeyDown = vi.fn();
		const onRef = vi.fn();
		const onParentKeyDown = vi.fn();
		render(() => (
			<div onKeyDown={onParentKeyDown}>
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Content onKeyDown={onKeyDown} ref={onRef}>
						<button type='button'>inside</button>
					</Popover.Content>
				</Popover.Root>
			</div>
		));
		expect(onRef).toHaveBeenCalledExactlyOnceWith(screen.getByRole('button', { name: 'inside' }).parentElement);
		fireEvent.keyDown(screen.getByRole('button', { name: 'inside' }), { key: 'a' });
		expect(onKeyDown).toHaveBeenCalledOnce();
		expect(onParentKeyDown).not.toHaveBeenCalled();
	});

	it('a user onClick runs first and event.preventDefault() cancels the toggle', () => {
		render(() => (
			<Popover.Root>
				<Popover.Trigger
					onClick={(event) => {
						event.preventDefault();
					}}
				>
					Open
				</Popover.Trigger>
				<Popover.Content>content</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(screen.queryByText('content')).toBeNull();
	});

	it('a function child receives the state, and usePopover works anywhere inside', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>
					{(state) => (
						<>
							<button type='button' onClick={state.close}>close-state</button>
							<CloseButton/>
						</>
					)}
				</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'close-state' }));
		expect(screen.queryByRole('button', { name: 'close-state' })).toBeNull();
	});

	it('usePopover closes the popover and reports the state', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content>
					<CloseButton/>
				</Popover.Content>
			</Popover.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'close-hook' }));
		expect(screen.queryByRole('button', { name: 'close-hook' })).toBeNull();
	});

	it('puts data-s-kit, the content marker, size, class and style on the panel', () => {
		render(() => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open</Popover.Trigger>
				<Popover.Content size='lg' class='extra' style={{ color: 'red' }} aria-label='Фильтры'>content</Popover.Content>
			</Popover.Root>
		));
		const panel = screen.getByText('content');
		expect(panel.hasAttribute('data-s-kit')).toBe(true);
		expect(panel.hasAttribute('data-s-kit-popover-content')).toBe(true);
		expect(panel.getAttribute('data-s-kit-size')).toBe('lg');
		expect(panel.className).toContain('extra');
		expect(panel.style.color).toBe('red');
		expect(panel.getAttribute('aria-label')).toBe('Фильтры');
	});

	it('mounts the panel next to the trigger, not inside a label around it', () => {
		render(() => (
			<section data-testid='host'>
				<label data-testid='label'>
					<Popover.Root defaultOpen>
						<Popover.Trigger>Open</Popover.Trigger>
						<Popover.Content>content</Popover.Content>
					</Popover.Root>
				</label>
			</section>
		));
		const panel = screen.getByText('content');
		expect(screen.getByTestId('label').contains(panel)).toBe(false);
		expect(screen.getByTestId('host').contains(panel)).toBe(true);
	});

	it('a click inside the panel does not reach the handlers of logical ancestors', () => {
		const onCardClick = vi.fn();
		const onCardDoubleClick = vi.fn();
		render(() => (
			<div onClick={onCardClick} onDblClick={onCardDoubleClick}>
				<Popover.Root defaultOpen>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Content>
						<button type='button'>inside</button>
					</Popover.Content>
				</Popover.Root>
			</div>
		));
		fireEvent.click(screen.getByRole('button', { name: 'inside' }));
		fireEvent.dblClick(screen.getByRole('button', { name: 'inside' }));
		expect(onCardClick).not.toHaveBeenCalled();
		expect(onCardDoubleClick).not.toHaveBeenCalled();
	});

	it('Popover.Content and usePopover outside Popover.Root throw a clear error', () => {
		const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(() => <Popover.Content>x</Popover.Content>)).toThrow('Popover.Content must be used inside Popover.Root');
		expect(() => render(() => <CloseButton/>)).toThrow('usePopover must be used inside Popover.Root');
		silence.mockRestore();
	});
});
