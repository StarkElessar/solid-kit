import { cleanup, createEvent, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContextMenu } from './index';

beforeEach(() => {
	HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
		this.removeAttribute('popover');
	});
	HTMLElement.prototype.hidePopover = vi.fn();
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

function renderMenu(onSelect: () => void = vi.fn()) {
	render(() => (
		<ContextMenu.Root defaultOpen anchorPoint={{ x: 10, y: 10 }}>
			<ContextMenu.Content aria-label='Корень'>
				<ContextMenu.Item>Переименовать</ContextMenu.Item>
				<ContextMenu.Sub>
					<ContextMenu.SubTrigger>Переместить в</ContextMenu.SubTrigger>
					<ContextMenu.SubContent>
						<ContextMenu.Item onSelect={onSelect}>Папка A</ContextMenu.Item>
						<ContextMenu.Item closeOnSelect={false}>Папка B</ContextMenu.Item>
						<ContextMenu.Sub>
							<ContextMenu.SubTrigger>Архив</ContextMenu.SubTrigger>
							<ContextMenu.SubContent aria-label='Архив'>
								<ContextMenu.Item>2024</ContextMenu.Item>
							</ContextMenu.SubContent>
						</ContextMenu.Sub>
					</ContextMenu.SubContent>
				</ContextMenu.Sub>
				<ContextMenu.Sub>
					<ContextMenu.SubTrigger disabled>Недоступное</ContextMenu.SubTrigger>
					<ContextMenu.SubContent>
						<ContextMenu.Item>Скрыто</ContextMenu.Item>
					</ContextMenu.SubContent>
				</ContextMenu.Sub>
			</ContextMenu.Content>
		</ContextMenu.Root>
	));
}

const subTrigger = (): HTMLElement => screen.getByRole('menuitem', { name: 'Переместить в' });

function press(key: string, target: Element = document.activeElement ?? document.body): Event {
	const event = createEvent.keyDown(target, { key });
	fireEvent(target, event);
	return event;
}

function openByKeyboard(): void {
	subTrigger().focus();
	press('ArrowRight');
}

describe('ContextMenu submenu', () => {
	it('SubTrigger announces a submenu and the state follows it', () => {
		renderMenu();
		expect(subTrigger().getAttribute('aria-haspopup')).toBe('menu');
		expect(subTrigger().getAttribute('aria-expanded')).toBe('false');
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		openByKeyboard();
		expect(subTrigger().getAttribute('aria-expanded')).toBe('true');
		const sub = screen.getByRole('menu', { name: 'Переместить в' });
		expect(subTrigger().getAttribute('aria-controls')).toBe(sub.id);
		expect(sub.getAttribute('aria-labelledby')).toBe(subTrigger().id);
	});

	it('ArrowRight, Enter and Space open it with the focus on the first item; ArrowLeft closes it and returns the focus', () => {
		renderMenu();
		for (const key of ['ArrowRight', 'Enter', ' ']) {
			subTrigger().focus();
			expect(press(key).defaultPrevented).toBe(true);
			expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Папка A' }));
			press('ArrowLeft');
			expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
			expect(document.activeElement).toBe(subTrigger());
		}
	});

	it('does not run the parent Enter handler for the SubTrigger (the submenu opens once, no activation)', () => {
		const onSelect = vi.fn();
		renderMenu(onSelect);
		subTrigger().focus();
		press('Enter');
		expect(onSelect).not.toHaveBeenCalled();
		expect(screen.getAllByRole('menu')).toHaveLength(2);
	});

	it('a click on SubTrigger opens it at once and a second click keeps it open', () => {
		renderMenu();
		fireEvent.click(subTrigger());
		expect(screen.getByRole('menu', { name: 'Переместить в' })).toBeTruthy();
		fireEvent.click(subTrigger());
		expect(screen.getByRole('menu', { name: 'Переместить в' })).toBeTruthy();
	});

	it('hovering opens it after 120 ms and keeps the focus on the SubTrigger; leaving earlier cancels', () => {
		vi.useFakeTimers();
		renderMenu();
		fireEvent.pointerMove(subTrigger());
		vi.advanceTimersByTime(119);
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		vi.advanceTimersByTime(1);
		expect(screen.getByRole('menu', { name: 'Переместить в' })).toBeTruthy();
		expect(document.activeElement).toBe(subTrigger());
		fireEvent.keyDown(document.body, { key: 'Escape' });

		fireEvent.pointerMove(subTrigger());
		fireEvent.pointerLeave(subTrigger());
		vi.advanceTimersByTime(500);
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
	});

	it('ArrowRight on a hover-opened submenu moves the focus into it', () => {
		vi.useFakeTimers();
		renderMenu();
		fireEvent.pointerMove(subTrigger());
		vi.advanceTimersByTime(120);
		press('ArrowRight');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Папка A' }));
	});

	it('moving to another item of the parent menu closes the submenu', () => {
		renderMenu();
		openByKeyboard();
		subTrigger().focus();
		fireEvent.pointerMove(screen.getByRole('menuitem', { name: 'Переименовать' }));
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		expect(screen.getByRole('menu', { name: 'Корень' })).toBeTruthy();
	});

	it('a disabled SubTrigger does not open', () => {
		vi.useFakeTimers();
		renderMenu();
		const disabled = screen.getByRole('menuitem', { name: 'Недоступное' });
		fireEvent.pointerMove(disabled);
		fireEvent.click(disabled);
		disabled.focus();
		press('ArrowRight', disabled);
		vi.advanceTimersByTime(500);
		expect(screen.getAllByRole('menu')).toHaveLength(1);
	});
});

describe('ContextMenu submenu layers', () => {
	it('Escape closes the submenu first, then the menu, and the focus returns to the SubTrigger', () => {
		renderMenu();
		openByKeyboard();
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		expect(screen.getByRole('menu', { name: 'Корень' })).toBeTruthy();
		expect(document.activeElement).toBe(subTrigger());
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a click outside both menus closes both with one click', () => {
		renderMenu();
		openByKeyboard();
		fireEvent.pointerDown(document.body);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a pointerdown inside the submenu or on its SubTrigger closes nothing; one on the parent menu closes only the submenu', () => {
		renderMenu();
		openByKeyboard();
		fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Папка B' }));
		fireEvent.pointerDown(subTrigger());
		expect(screen.getAllByRole('menu')).toHaveLength(2);
		fireEvent.pointerDown(screen.getByRole('menuitem', { name: 'Переименовать' }));
		expect(screen.queryByRole('menu', { name: 'Переместить в' })).toBeNull();
		expect(screen.getByRole('menu', { name: 'Корень' })).toBeTruthy();
	});

	it('an activated submenu item closes the whole chain, closeOnSelect={false} keeps both open', () => {
		const onSelect = vi.fn();
		renderMenu(onSelect);
		openByKeyboard();
		fireEvent.click(screen.getByRole('menuitem', { name: 'Папка B' }));
		expect(screen.getAllByRole('menu')).toHaveLength(2);
		fireEvent.click(screen.getByRole('menuitem', { name: 'Папка A' }));
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('Tab inside the submenu closes the whole chain', () => {
		renderMenu();
		openByKeyboard();
		expect(press('Tab').defaultPrevented).toBe(true);
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('arrows inside the submenu navigate only its items', () => {
		renderMenu();
		openByKeyboard();
		press('ArrowDown');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Папка B' }));
		press('ArrowUp');
		press('ArrowUp');
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Архив' }));
	});

	it('nests without a depth limit: Escape closes three levels one by one', () => {
		renderMenu();
		openByKeyboard();
		screen.getByRole('menuitem', { name: 'Архив' }).focus();
		press('ArrowRight');
		expect(screen.getAllByRole('menu')).toHaveLength(3);
		expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: '2024' }));
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.getAllByRole('menu')).toHaveLength(2);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.getAllByRole('menu')).toHaveLength(1);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('a scroll outside closes every level', () => {
		renderMenu();
		openByKeyboard();
		document.dispatchEvent(new Event('scroll'));
		expect(screen.queryByRole('menu')).toBeNull();
	});
});

describe('ContextMenu submenu errors', () => {
	it('SubTrigger and SubContent outside Sub throw', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const wrap = (inner: () => ReturnType<typeof ContextMenu.SubTrigger>) => () => (
			<ContextMenu.Root defaultOpen anchorPoint={{ x: 0, y: 0 }}>
				<ContextMenu.Content>{inner()}</ContextMenu.Content>
			</ContextMenu.Root>
		);
		expect(() => render(wrap(() => <ContextMenu.SubTrigger>x</ContextMenu.SubTrigger>))).toThrow(
			'ContextMenu.SubTrigger must be used inside ContextMenu.Sub'
		);
		expect(() => render(wrap(() => <ContextMenu.SubContent>x</ContextMenu.SubContent>))).toThrow(
			'ContextMenu.SubContent must be used inside ContextMenu.Sub'
		);
	});

	it('Sub outside Content throws', () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		expect(() => render(() => <ContextMenu.Sub>x</ContextMenu.Sub>)).toThrow('ContextMenu.Sub must be used inside ContextMenu.Content');
	});
});
