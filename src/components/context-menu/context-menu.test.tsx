import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextMenu } from './index';

beforeEach(() => {
	// jsdom не реализует Popover API и считает содержимое закрытого [popover] нефокусируемым: «показ» снимает атрибут
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(cleanup);

function renderMenu(onSelect: () => void = vi.fn(), onOpenChange?: (open: boolean) => void) {
	render(() => (
		<ContextMenu.Root onOpenChange={onOpenChange}>
			<ContextMenu.Trigger data-testid='area'>
				<button type='button'>inner</button>
			</ContextMenu.Trigger>
			<ContextMenu.Content aria-label='Меню'>
				<ContextMenu.Item onSelect={onSelect}>Первый</ContextMenu.Item>
				<ContextMenu.Item disabled>Второй</ContextMenu.Item>
				<ContextMenu.Separator/>
				<ContextMenu.Item variant='danger'>Третий</ContextMenu.Item>
				<ContextMenu.Item closeOnSelect={false}>Четвёртый</ContextMenu.Item>
			</ContextMenu.Content>
		</ContextMenu.Root>
	));
	return { area: screen.getByTestId('area'), inner: screen.getByText('inner') };
}

function openByMouse(area: HTMLElement): boolean {
	return fireEvent.contextMenu(area, { clientX: 120, clientY: 80 });
}

function press(key: string, target: Element = document.activeElement ?? document.body): Event {
	const event = createEvent.keyDown(target, { key });
	fireEvent(target, event);
	return event;
}

describe('ContextMenu opening', () => {
	it('is closed by default and opens on contextmenu, cancelling the native menu', () => {
		const { area } = renderMenu();
		expect(screen.queryByRole('menu')).toBeNull();
		expect(openByMouse(area)).toBe(false);
		expect(screen.getByRole('menu', { name: 'Меню' })).toBeTruthy();
	});

	it('a disabled trigger leaves the native menu alone', () => {
		render(() => (
			<ContextMenu.Root>
				<ContextMenu.Trigger disabled data-testid='area'>area</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(openByMouse(screen.getByTestId('area'))).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('opens from the keyboard (ContextMenu key and Shift+F10) with the focus on the first enabled item', () => {
		const { inner } = renderMenu();
		inner.focus();
		const event = press('ContextMenu', inner);
		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		fireEvent.keyDown(inner, { key: 'F10', shiftKey: true });
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('opens by mouse with the focus on the menu itself, not on an item', () => {
		const { area } = renderMenu();
		openByMouse(area);
		expect(document.activeElement).toBe(screen.getByRole('menu'));
	});

	it('is opened from outside with open and anchorPoint, without a trigger', () => {
		render(() => (
			<ContextMenu.Root open anchorPoint={{ x: 10, y: 20 }}>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('shows nothing while it is open but has no point', () => {
		render(() => (
			<ContextMenu.Root open>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('controlled: the contextmenu only reports the change, the prop decides', () => {
		const onOpenChange = vi.fn();
		render(() => (
			<ContextMenu.Root open={false} onOpenChange={onOpenChange}>
				<ContextMenu.Trigger data-testid='area'>area</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		openByMouse(screen.getByTestId('area'));
		expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a right click on the open menu does not bring up the native menu', () => {
		const { area } = renderMenu();
		openByMouse(area);
		expect(fireEvent.contextMenu(screen.getByRole('menuitem', { name: 'Первый' }))).toBe(false);
	});
});

describe('ContextMenu semantics', () => {
	it('gives the parts menu, menuitem and separator roles; a disabled item is aria-disabled; danger is marked', () => {
		const { area } = renderMenu();
		openByMouse(area);
		expect(screen.getAllByRole('menuitem')).toHaveLength(4);
		expect(screen.getByRole('separator')).toBeTruthy();
		expect(screen.getByRole('menuitem', { name: 'Второй' }).getAttribute('aria-disabled')).toBe('true');
		expect(screen.getByRole('menuitem', { name: 'Первый' }).hasAttribute('aria-disabled')).toBe(false);
		expect(screen.getByRole('menuitem', { name: 'Третий' }).getAttribute('data-variant')).toBe('danger');
		expect(screen.getByRole('menuitem', { name: 'Первый' }).getAttribute('tabindex')).toBe('-1');
	});

	it('marks the panel with the inset focus ring attribute', () => {
		const { area } = renderMenu();
		openByMouse(area);
		const menu = screen.getByRole('menu');
		expect(menu.hasAttribute('data-s-kit-focus-inset')).toBe(true);
		expect(menu.hasAttribute('data-s-kit-menu')).toBe(true);
	});
});

describe('ContextMenu keyboard', () => {
	it('arrows move the focus around the circle and skip the disabled item; Home and End jump', () => {
		const { area } = renderMenu();
		openByMouse(area);
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Третий' }));
		press('ArrowDown');
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		press('ArrowUp');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		press('Home');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Первый' }));
		press('End');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		expect(press('ArrowDown').defaultPrevented).toBe(true);
	});

	it('Enter and Space activate the focused item, cancelling the default action', () => {
		const onSelect = vi.fn();
		const { area } = renderMenu(onSelect);
		openByMouse(area);
		press('ArrowDown');
		expect(press('Enter').defaultPrevented).toBe(true);
		expect(onSelect).toHaveBeenCalledTimes(1);
		openByMouse(area);
		press('ArrowDown');
		expect(press(' ').defaultPrevented).toBe(true);
		expect(onSelect).toHaveBeenCalledTimes(2);
	});

	it('Tab closes the menu, cancelling the move of the focus, and the focus goes back to who held it', () => {
		const { area, inner } = renderMenu();
		inner.focus();
		openByMouse(area);
		const event = press('Tab');
		expect(event.defaultPrevented).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(inner);
	});

	it('Escape closes the menu and returns the focus to the element that held it before', () => {
		const { area, inner } = renderMenu();
		inner.focus();
		openByMouse(area);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(inner);
	});
});

describe('ContextMenu activation and pointer', () => {
	it('a click on an item runs onSelect and closes the menu once; the menu is already closed when onSelect runs', () => {
		const onOpenChange = vi.fn();
		let menuWasOpen = true;
		let focusedDuring: Element | null = null;
		const onSelect = vi.fn(() => {
			menuWasOpen = screen.queryByRole('menu') !== null;
			focusedDuring = document.activeElement;
		});
		const { area, inner } = renderMenu(onSelect, onOpenChange);
		inner.focus();
		openByMouse(area);
		fireEvent.click(screen.getByRole('menuitem', { name: 'Первый' }));
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(menuWasOpen).toBe(false);
		expect(focusedDuring).toBe(inner);
		expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
	});

	it('closeOnSelect={false} keeps the menu open', () => {
		const { area } = renderMenu();
		openByMouse(area);
		fireEvent.click(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('a disabled item neither activates nor takes the focus on hover', () => {
		const onSelect = vi.fn();
		render(() => (
			<ContextMenu.Root defaultOpen anchorPoint={{ x: 0, y: 0 }}>
				<ContextMenu.Content>
					<ContextMenu.Item disabled onSelect={onSelect}>Off</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		const item = screen.getByRole('menuitem');
		fireEvent.click(item);
		fireEvent.pointerMove(item);
		expect(onSelect).not.toHaveBeenCalled();
		expect(document.activeElement).not.toBe(item);
		expect(screen.getByRole('menu')).toBeTruthy();
	});

	it('moving the pointer over an item focuses it', () => {
		const { area } = renderMenu();
		openByMouse(area);
		const item = screen.getByRole('menuitem', { name: 'Третий' });
		fireEvent.pointerMove(item);
		expect(document.activeElement).toBe(item);
	});

	it('a click outside closes the menu, a click inside does not', () => {
		const { area } = renderMenu();
		openByMouse(area);
		fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Четвёртый' }));
		expect(screen.getByRole('menu')).toBeTruthy();
		fireEvent.pointerDown(area);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a right click elsewhere in the area moves the menu: it closes and opens again', () => {
		const onOpenChange = vi.fn();
		const { area } = renderMenu(vi.fn(), onOpenChange);
		openByMouse(area);
		fireEvent.pointerDown(area, { button: 2 });
		openByMouse(area);
		expect(screen.getByRole('menu')).toBeTruthy();
		expect(onOpenChange.mock.calls).toEqual([[true], [false], [true]]);
	});

	it('closes on a scroll outside and on a window resize, but not on a scroll inside the menu', () => {
		const { area } = renderMenu();
		openByMouse(area);
		screen.getByRole('menu').dispatchEvent(new Event('scroll'));
		expect(screen.getByRole('menu')).toBeTruthy();
		document.dispatchEvent(new Event('scroll'));
		expect(screen.queryByRole('menu')).toBeNull();
		openByMouse(area);
		window.dispatchEvent(new Event('resize'));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('isolates clicks inside the menu from logical ancestors', () => {
		const onAncestorClick = vi.fn();
		render(() => (
			<div onClick={onAncestorClick}>
				<ContextMenu.Root defaultOpen anchorPoint={{ x: 0, y: 0 }}>
					<ContextMenu.Content>
						<ContextMenu.Item>Один</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</div>
		));
		fireEvent.click(screen.getByRole('menuitem'));
		expect(onAncestorClick).not.toHaveBeenCalled();
	});
});

describe('ContextMenu errors', () => {
	it('Trigger and Content outside Root throw', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(() => <ContextMenu.Trigger>x</ContextMenu.Trigger>)).toThrow(
			'ContextMenu.Trigger must be used inside ContextMenu.Root'
		);
		expect(() => render(() => <ContextMenu.Content>x</ContextMenu.Content>)).toThrow(
			'ContextMenu.Content must be used inside ContextMenu.Root'
		);
	});

	it('Item outside Content throws', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(() => <ContextMenu.Item>x</ContextMenu.Item>)).toThrow(
			'ContextMenu.Item must be used inside ContextMenu.Content'
		);
	});
});
