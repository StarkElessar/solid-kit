import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubDialogApi } from '../../internal/testing/stub-dialog-api';
import { Popover } from '../popover';

import { Dialog, useDialog } from './index';

let dialogApi = stubDialogApi();

beforeEach(() => {
	dialogApi = stubDialogApi();
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(() => {
	cleanup();
	dialogApi.restore();
});

function CloseFromHook() {
	const dialog = useDialog();
	return <button type='button' onClick={dialog.close}>close-hook</button>;
}

function getDialog(): HTMLDialogElement {
	const dialog = document.querySelector('dialog');
	if (!dialog) {
		throw new Error('dialog is not rendered');
	}
	return dialog;
}

/** Событие мыши с координатами и именем нужного типа: PointerEvent может отсутствовать в jsdom, а `fireEvent` тогда теряет `clientX`. */
function press(target: Element, type: 'pointerdown' | 'click', clientX: number, clientY: number): void {
	target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY }));
}

const DIALOG_RECT = { left: 100, right: 300, top: 100, bottom: 300 } as DOMRect;

describe('Dialog', () => {
	it('is closed by default, opens on the trigger click as a modal dialog and wires the trigger attributes', () => {
		render(() => (
			<Dialog.Root>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		expect(document.querySelector('dialog')).toBeNull();
		expect(trigger.getAttribute('aria-expanded')).toBe('false');
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
		fireEvent.click(trigger);
		const dialog = getDialog();
		expect(dialogApi.showModal).toHaveBeenCalledOnce();
		expect(dialog.hasAttribute('open')).toBe(true);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(trigger.getAttribute('aria-controls')).toBe(dialog.id);
		expect(trigger.hasAttribute('data-dialog-open')).toBe(true);
	});

	it('controlled: the trigger click only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root open={false} onOpenChange={onOpenChange}>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Open' }));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('defaultOpen starts open and closes the dialog element when the state becomes false', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		expect(dialog.hasAttribute('open')).toBe(true);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.querySelector('dialog')).toBeNull();
		expect(dialogApi.close).toHaveBeenCalled();
	});

	it('Escape goes through the layer stack: onOpenChange(false) exactly once and the default action is cancelled', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const event = createEvent.keyDown(document.body, { key: 'Escape' });
		fireEvent(document.body, event);
		expect(event.defaultPrevented).toBe(true);
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('closeOnEscape={false}: Escape does not close the dialog but its default action is still cancelled', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen closeOnEscape={false} onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const event = createEvent.keyDown(document.body, { key: 'Escape' });
		fireEvent(document.body, event);
		expect(event.defaultPrevented).toBe(true);
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(getDialog().hasAttribute('open')).toBe(true);
	});

	it('the cancel event of the dialog is always cancelled', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const cancel = new Event('cancel', { cancelable: true });
		getDialog().dispatchEvent(cancel);
		expect(cancel.defaultPrevented).toBe(true);
		expect(getDialog().hasAttribute('open')).toBe(true);
	});

	it('a close event from another source (form method=dialog) is synced: onOpenChange(false) once, the dialog unmounts', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		getDialog().close();
		dialogApi.flush();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('controlled: when the parent keeps open={true} after an external close, the dialog is opened again', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root open onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		dialog.close();
		dialogApi.flush();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
		expect(dialog.hasAttribute('open')).toBe(true);
		expect(dialogApi.showModal).toHaveBeenCalledTimes(2);
	});

	it('a delayed close event of the previous dialog instance is ignored after a quick reopen', () => {
		const onOpenChange = vi.fn();
		const [open, setOpen] = createSignal(true);
		render(() => (
			<Dialog.Root open={open()} onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		setOpen(false);
		setOpen(true);
		dialogApi.flush();
		expect(onOpenChange).not.toHaveBeenCalled();
		expect(getDialog().hasAttribute('open')).toBe(true);
	});

	it('unmounting an open controlled dialog neither reopens the detached element nor reports a change', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root open onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		cleanup();
		expect(() => {
			dialogApi.flush();
		}).not.toThrow();
		expect(dialogApi.showModal).toHaveBeenCalledOnce();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('controlled: the dialog element is closed when the parent sets open to false, without a second onOpenChange', () => {
		const onOpenChange = vi.fn();
		const [open, setOpen] = createSignal(true);
		render(() => (
			<Dialog.Root open={open()} onOpenChange={onOpenChange}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		setOpen(false);
		expect(document.querySelector('dialog')).toBeNull();
		expect(dialogApi.close).toHaveBeenCalled();
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('a click on the backdrop closes the dialog; a click inside, or a selection ending over the backdrop, does not', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(DIALOG_RECT);
		const inside = screen.getByRole('button', { name: 'inside' });

		press(inside, 'pointerdown', 150, 150);
		press(inside, 'click', 150, 150);
		expect(document.querySelector('dialog')).not.toBeNull();

		// выделение: нажатие внутри, отпускание над подложкой
		press(inside, 'pointerdown', 150, 150);
		press(dialog, 'click', 20, 20);
		expect(document.querySelector('dialog')).not.toBeNull();

		// клик по отступу самого диалога (цель `<dialog>`, но точка внутри прямоугольника)
		press(dialog, 'pointerdown', 150, 150);
		press(dialog, 'click', 150, 150);
		expect(document.querySelector('dialog')).not.toBeNull();

		press(dialog, 'pointerdown', 20, 20);
		press(dialog, 'click', 20, 20);
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('closeOnBackdropClick={false}: a click on the backdrop keeps the dialog open', () => {
		render(() => (
			<Dialog.Root defaultOpen closeOnBackdropClick={false}>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(DIALOG_RECT);
		press(dialog, 'pointerdown', 20, 20);
		press(dialog, 'click', 20, 20);
		expect(document.querySelector('dialog')).not.toBeNull();
	});

	it('puts data-s-kit, the content marker, size, class, style and attributes on the dialog and calls ref and onKeyDown', () => {
		const onRef = vi.fn();
		const onKeyDown = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content size='lg' class='extra' style={{ color: 'red' }} aria-label='Диалог' ref={onRef} onKeyDown={onKeyDown}>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const dialog = getDialog();
		expect(dialog.hasAttribute('data-s-kit')).toBe(true);
		expect(dialog.hasAttribute('data-s-kit-dialog')).toBe(true);
		expect(dialog.getAttribute('data-s-kit-size')).toBe('lg');
		expect(dialog.className).toContain('extra');
		expect(dialog.style.color).toBe('red');
		expect(dialog.getAttribute('aria-label')).toBe('Диалог');
		expect(onRef).toHaveBeenCalledExactlyOnceWith(dialog);
		fireEvent.keyDown(screen.getByRole('button', { name: 'inside' }), { key: 'a' });
		expect(onKeyDown).toHaveBeenCalledOnce();
	});

	it('a function child receives the state, and useDialog works anywhere inside', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					{(state) => (
						<>
							<button type='button' onClick={state.close}>close-state</button>
							<CloseFromHook/>
						</>
					)}
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'close-hook' }));
		expect(document.querySelector('dialog')).toBeNull();
	});

	it('a custom trigger through render receives the attributes, a user onClick may cancel the toggle, ref is kept', () => {
		const onRef = vi.fn();
		render(() => (
			<Dialog.Root>
				<Dialog.Trigger render={(attributes) => <span {...attributes} data-testid='custom' role='button'>custom</span>}/>
				<Dialog.Trigger
					ref={onRef}
					onClick={(event) => {
						event.preventDefault();
					}}
				>
					Blocked
				</Dialog.Trigger>
				<Dialog.Content>content</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Blocked' }));
		expect(document.querySelector('dialog')).toBeNull();
		expect(onRef).toHaveBeenCalledOnce();
		fireEvent.click(screen.getByTestId('custom'));
		expect(document.querySelector('dialog')).not.toBeNull();
	});

	it('with two triggers the dialog opens in the host of the one that was pressed, and the focus returns to it', () => {
		render(() => (
			<Dialog.Root>
				<section data-testid='host-a'>
					<Dialog.Trigger>Open A</Dialog.Trigger>
				</section>
				<section data-testid='host-b'>
					<Dialog.Trigger>Open B</Dialog.Trigger>
				</section>
				<Dialog.Content>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const triggerA = screen.getByRole('button', { name: 'Open A' });
		triggerA.focus();
		fireEvent.click(triggerA);
		expect(screen.getByTestId('host-a').contains(getDialog())).toBe(true);
		expect(screen.getByTestId('host-b').contains(getDialog())).toBe(false);
		screen.getByRole('button', { name: 'inside' }).focus();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.activeElement).toBe(triggerA);
	});

	it('mounts the dialog next to the trigger, not inside a label around it', () => {
		render(() => (
			<section data-testid='host'>
				<label data-testid='label'>
					<Dialog.Root defaultOpen>
						<Dialog.Trigger>Open</Dialog.Trigger>
						<Dialog.Content>content</Dialog.Content>
					</Dialog.Root>
				</label>
			</section>
		));
		expect(screen.getByTestId('label').contains(getDialog())).toBe(false);
		expect(screen.getByTestId('host').contains(getDialog())).toBe(true);
	});

	it('events inside the dialog do not reach the handlers of logical ancestors', () => {
		const onCardClick = vi.fn();
		const onCardKeyDown = vi.fn();
		render(() => (
			<div onClick={onCardClick} onKeyDown={onCardKeyDown}>
				<Dialog.Root defaultOpen>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Content>
						<button type='button'>inside</button>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		));
		fireEvent.click(screen.getByRole('button', { name: 'inside' }));
		fireEvent.keyDown(screen.getByRole('button', { name: 'inside' }), { key: 'a' });
		expect(onCardClick).not.toHaveBeenCalled();
		expect(onCardKeyDown).not.toHaveBeenCalled();
	});

	it('cancels Enter in an input whose form is outside the dialog, so that the host form is not submitted', () => {
		render(() => (
			<form>
				<Dialog.Root defaultOpen>
					<Dialog.Trigger>Open</Dialog.Trigger>
					<Dialog.Content>
						<input aria-label='name'/>
					</Dialog.Content>
				</Dialog.Root>
			</form>
		));
		const event = createEvent.keyDown(screen.getByLabelText('name'), { key: 'Enter' });
		fireEvent(screen.getByLabelText('name'), event);
		expect(event.defaultPrevented).toBe(true);
	});

	it('returns the focus to the trigger when the dialog closes', () => {
		render(() => (
			<Dialog.Root>
				<Dialog.Trigger>Open</Dialog.Trigger>
				<Dialog.Content>
					<button type='button'>inside</button>
				</Dialog.Content>
			</Dialog.Root>
		));
		const trigger = screen.getByRole('button', { name: 'Open' });
		trigger.focus();
		fireEvent.click(trigger);
		screen.getByRole('button', { name: 'inside' }).focus();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.activeElement).toBe(trigger);
	});

	it('without a trigger, the focus returns to the element that was active before the dialog opened', () => {
		const [open, setOpen] = createSignal(false);
		render(() => (
			<>
				<button type='button'>outside</button>
				<Dialog.Root open={open()} onOpenChange={setOpen}>
					<Dialog.Content>
						<button type='button'>inside</button>
					</Dialog.Content>
				</Dialog.Root>
			</>
		));
		const outside = screen.getByRole('button', { name: 'outside' });
		outside.focus();
		setOpen(true);
		screen.getByRole('button', { name: 'inside' }).focus();
		setOpen(false);
		expect(document.activeElement).toBe(outside);
	});

	it('a Popover inside the dialog is mounted into the dialog; Escape closes the popover first and the dialog second', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<Dialog.Root defaultOpen onOpenChange={onOpenChange}>
				<Dialog.Content>
					<Popover.Root>
						<Popover.Trigger>Panel</Popover.Trigger>
						<Popover.Content>
							<input aria-label='in-panel'/>
						</Popover.Content>
					</Popover.Root>
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.click(screen.getByRole('button', { name: 'Panel' }));
		expect(getDialog().contains(screen.getByLabelText('in-panel'))).toBe(true);

		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByLabelText('in-panel')).toBeNull();
		expect(document.querySelector('dialog')).not.toBeNull();
		expect(onOpenChange).not.toHaveBeenCalled();

		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(document.querySelector('dialog')).toBeNull();
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
	});

	it('a click inside the dialog outside the popover closes the popover but not the modal dialog', () => {
		render(() => (
			<Dialog.Root defaultOpen>
				<Dialog.Content>
					<button type='button'>inside</button>
					<Popover.Root defaultOpen>
						<Popover.Trigger>Panel</Popover.Trigger>
						<Popover.Content>
							<input aria-label='in-panel'/>
						</Popover.Content>
					</Popover.Root>
				</Dialog.Content>
			</Dialog.Root>
		));
		fireEvent.pointerDown(screen.getByRole('button', { name: 'inside' }));
		expect(screen.queryByLabelText('in-panel')).toBeNull();
		expect(document.querySelector('dialog')).not.toBeNull();
	});

	it('Dialog.Content and useDialog outside Dialog.Root throw a clear error', () => {
		const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => render(() => <Dialog.Content>x</Dialog.Content>)).toThrow('Dialog.Content must be used inside Dialog.Root');
		expect(() => render(() => <CloseFromHook/>)).toThrow('useDialog must be used inside Dialog.Root');
		silence.mockRestore();
	});
});
