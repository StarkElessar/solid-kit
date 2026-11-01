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
	onOpenChange?: (open: boolean) => void;
	closeOnSelect?: boolean;
	disabled?: boolean;
}

function Harness(props: HarnessProps) {
	const [checked, setChecked] = createSignal(false);
	return (
		<ContextMenu.Root open anchorPoint={{ x: 10, y: 20 }} onOpenChange={props.onOpenChange}>
			<ContextMenu.Content aria-label='Меню'>
				<ContextMenu.Item>Обычный</ContextMenu.Item>
				<ContextMenu.Group label='Колонки'>
					<ContextMenu.CheckboxItem
						checked={checked()}
						onCheckedChange={setChecked}
						closeOnSelect={props.closeOnSelect}
						disabled={props.disabled}
					>Первая</ContextMenu.CheckboxItem>
					<ContextMenu.CheckboxItem checked>Вторая</ContextMenu.CheckboxItem>
				</ContextMenu.Group>
			</ContextMenu.Content>
		</ContextMenu.Root>
	);
}

describe('ContextMenu.CheckboxItem', () => {
	it('имеет роль menuitemcheckbox и aria-checked по checked', () => {
		render(() => <Harness/>);
		expect(screen.getByRole('menuitemcheckbox', { name: 'Первая' }).getAttribute('aria-checked')).toBe('false');
		expect(screen.getByRole('menuitemcheckbox', { name: 'Вторая' }).getAttribute('aria-checked')).toBe('true');
	});

	it('клик сообщает противоположное значение и по умолчанию не закрывает меню', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		const item = screen.getByRole('menuitemcheckbox', { name: 'Первая' });
		fireEvent.click(item);
		expect(item.getAttribute('aria-checked')).toBe('true');
		fireEvent.click(item);
		expect(item.getAttribute('aria-checked')).toBe('false');
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('closeOnSelect закрывает меню', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange} closeOnSelect/>);
		fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Первая' }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it('отключённый переключатель помечен aria-disabled и не реагирует', () => {
		render(() => <Harness disabled/>);
		const item = screen.getByRole('menuitemcheckbox', { name: 'Первая' });
		expect(item.getAttribute('aria-disabled')).toBe('true');
		fireEvent.click(item);
		expect(item.getAttribute('aria-checked')).toBe('false');
	});

	it('Enter и Space переключают, меню остаётся открытым', () => {
		const onOpenChange = vi.fn();
		render(() => <Harness onOpenChange={onOpenChange}/>);
		const item = screen.getByRole('menuitemcheckbox', { name: 'Первая' });
		item.focus();
		fireEvent.keyDown(item, { key: 'Enter' });
		expect(item.getAttribute('aria-checked')).toBe('true');
		fireEvent.keyDown(item, { key: ' ' });
		expect(item.getAttribute('aria-checked')).toBe('false');
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	it('стрелки ходят между обычным пунктом и переключателями внутри группы', () => {
		render(() => <Harness/>);
		const first = screen.getByRole('menuitem', { name: 'Обычный' });
		first.focus();
		fireEvent.keyDown(first, { key: 'ArrowDown' });
		expect(document.activeElement).toBe(screen.getByRole('menuitemcheckbox', { name: 'Первая' }));
		fireEvent.keyDown(document.activeElement ?? first, { key: 'End' });
		expect(document.activeElement).toBe(screen.getByRole('menuitemcheckbox', { name: 'Вторая' }));
	});
});

describe('ContextMenu.Group', () => {
	it('это role=group с именем из подписи', () => {
		render(() => <Harness/>);
		expect(screen.getByRole('group', { name: 'Колонки' })).toBeTruthy();
	});
});
