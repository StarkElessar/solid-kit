import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
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

interface HarnessProps {
	initiallyOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
}

function Harness(props: HarnessProps) {
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [open, setOpen] = createSignal(props.initiallyOpen ?? true);
	return (
		<>
			<button type='button' data-testid='anchor' ref={setAnchor}>якорь</button>
			<button type='button' data-testid='outside'>снаружи</button>
			<button type='button' data-testid='toggle' onClick={() => setOpen(!open())}>переключить</button>
			<ContextMenu.Root
				open={open()}
				onOpenChange={(next) => {
					setOpen(next);
					props.onOpenChange?.(next);
				}}
				anchorElement={anchor()}
			>
				<ContextMenu.Content aria-label='Меню' placement='bottom-end'>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</>
	);
}

describe('ContextMenu: anchorElement', () => {
	it('открывается от элемента без точки', () => {
		render(() => <Harness/>);
		expect(screen.getByRole('menu', { name: 'Меню' })).toBeTruthy();
	});

	it('без якоря и без точки меню не показывается', () => {
		render(() => (
			<ContextMenu.Root open>
				<ContextMenu.Content aria-label='Меню'>
					<ContextMenu.Item>Один</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		));
		expect(screen.queryByRole('menu')).toBeNull();
	});

	it('pointerdown по якорю не закрывает меню, снаружи закрывает', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		fireEvent.pointerDown(screen.getByTestId('anchor'));
		expect(onOpenChange).not.toHaveBeenCalled();
		fireEvent.pointerDown(screen.getByTestId('outside'));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('Esc закрывает меню', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		fireEvent.keyDown(document.body, { key: 'Escape' });
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('после закрытия фокус возвращается на якорь, если прежнего владельца фокуса не было', () => {
		render(() => <Harness initiallyOpen={false}/>);
		fireEvent.click(screen.getByTestId('toggle'));
		expect(screen.getByRole('menu')).toBeTruthy();
		fireEvent.click(screen.getByTestId('toggle'));
		expect(screen.queryByRole('menu')).toBeNull();
		expect(document.activeElement).toBe(screen.getByTestId('anchor'));
	});
});
