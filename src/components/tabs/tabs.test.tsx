import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX, Show } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Tabs } from './index';

afterEach(cleanup);

function Items(): JSX.Element {
	return (
		<>
			<Tabs.Tab value='overview'>Обзор</Tabs.Tab>
			<Tabs.Tab value='details'>Детали</Tabs.Tab>
			<Tabs.Tab value='log'>Журнал</Tabs.Tab>
		</>
	);
}

function Panels(): JSX.Element {
	return (
		<>
			<Tabs.Panel value='overview'>Текст обзора</Tabs.Panel>
			<Tabs.Panel value='details'>Текст деталей</Tabs.Panel>
			<Tabs.Panel value='log'>Текст журнала</Tabs.Panel>
		</>
	);
}

function tab(name: string): HTMLElement {
	return screen.getByRole('tab', { name });
}

function isSelected(name: string): boolean {
	return tab(name).getAttribute('aria-selected') === 'true';
}

function key(target: HTMLElement, pressed: string, init: KeyboardEventInit = {}): boolean {
	return fireEvent.keyDown(target, { key: pressed, ...init });
}

describe('Tabs', () => {
	it('renders a labelled tablist of button tabs and only the selected panel', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
				<Panels/>
			</Tabs.Root>
		));
		expect(screen.getByRole('tablist', { name: 'Разделы' })).toBeTruthy();
		expect(screen.getAllByRole('tab').length).toBe(3);
		expect(tab('Обзор').tagName).toBe('BUTTON');
		expect(tab('Обзор').getAttribute('type')).toBe('button');
		expect(screen.getByRole('tabpanel').textContent).toBe('Текст обзора');
		expect(screen.queryByText('Текст деталей')).toBeNull();
	});

	it('marks the selected tab and links tabs and panels by id', () => {
		render(() => (
			<Tabs.Root defaultValue='details'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
				<Panels/>
			</Tabs.Root>
		));
		expect(isSelected('Детали')).toBe(true);
		expect(isSelected('Обзор')).toBe(false);
		const panel = screen.getByRole('tabpanel', { name: 'Детали' });
		expect(tab('Детали').getAttribute('aria-controls')).toBe(panel.id);
		expect(panel.getAttribute('aria-labelledby')).toBe(tab('Детали').id);
	});

	it('keeps the ids valid for a value with spaces', () => {
		render(() => (
			<Tabs.Root defaultValue='a b'>
				<Tabs.List aria-label='Разделы'><Tabs.Tab value='a b'>Раз два</Tabs.Tab></Tabs.List>
				<Tabs.Panel value='a b'>Содержимое</Tabs.Panel>
			</Tabs.Root>
		));
		const controls = tab('Раз два').getAttribute('aria-controls') ?? '';
		expect(/\s/.test(controls)).toBe(false);
		expect(/\s/.test(tab('Раз два').id)).toBe(false);
		expect(document.getElementById(controls)?.getAttribute('role')).toBe('tabpanel');
	});

	it('selects a tab on click and reports the value once', () => {
		const onValueChange = vi.fn();
		render(() => (
			<Tabs.Root defaultValue='overview' onValueChange={onValueChange}>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
				<Panels/>
			</Tabs.Root>
		));
		fireEvent.click(tab('Журнал'));
		expect(isSelected('Журнал')).toBe(true);
		expect(isSelected('Обзор')).toBe(false);
		expect(screen.getByRole('tabpanel').textContent).toBe('Текст журнала');
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith('log');
	});

	it('does not report a click on the already selected tab', () => {
		const onValueChange = vi.fn();
		render(() => (
			<Tabs.Root defaultValue='overview' onValueChange={onValueChange}>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
			</Tabs.Root>
		));
		fireEvent.click(tab('Обзор'));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('does not select a disabled tab', () => {
		const onValueChange = vi.fn();
		render(() => (
			<Tabs.Root defaultValue='overview' onValueChange={onValueChange}>
				<Tabs.List aria-label='Разделы'>
					<Tabs.Tab value='overview'>Обзор</Tabs.Tab>
					<Tabs.Tab value='details' disabled>Детали</Tabs.Tab>
				</Tabs.List>
			</Tabs.Root>
		));
		(tab('Детали') as HTMLButtonElement).click();
		expect(isSelected('Детали')).toBe(false);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('puts only the selected tab in the tab order', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
			</Tabs.Root>
		));
		expect(tab('Обзор').getAttribute('tabindex')).toBe('0');
		expect(tab('Детали').getAttribute('tabindex')).toBe('-1');
		fireEvent.click(tab('Детали'));
		expect(tab('Детали').getAttribute('tabindex')).toBe('0');
		expect(tab('Обзор').getAttribute('tabindex')).toBe('-1');
	});

	it('puts the first enabled tab in the tab order when nothing is selected', () => {
		render(() => (
			<Tabs.Root>
				<Tabs.List aria-label='Разделы'>
					<Tabs.Tab value='overview' disabled>Обзор</Tabs.Tab>
					<Tabs.Tab value='details'>Детали</Tabs.Tab>
					<Tabs.Tab value='log'>Журнал</Tabs.Tab>
				</Tabs.List>
			</Tabs.Root>
		));
		expect(tab('Обзор').getAttribute('tabindex')).toBe('-1');
		expect(tab('Детали').getAttribute('tabindex')).toBe('0');
		expect(tab('Журнал').getAttribute('tabindex')).toBe('-1');
		expect(screen.queryByRole('tabpanel')).toBeNull();
	});

	it('moves focus and selection with the arrows, wrapping around and skipping disabled tabs', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы'>
					<Tabs.Tab value='overview'>Обзор</Tabs.Tab>
					<Tabs.Tab value='details' disabled>Детали</Tabs.Tab>
					<Tabs.Tab value='log'>Журнал</Tabs.Tab>
				</Tabs.List>
			</Tabs.Root>
		));
		tab('Обзор').focus();
		expect(key(tab('Обзор'), 'ArrowRight')).toBe(false);
		expect(document.activeElement).toBe(tab('Журнал'));
		expect(isSelected('Журнал')).toBe(true);
		key(tab('Журнал'), 'ArrowRight');
		expect(document.activeElement).toBe(tab('Обзор'));
		expect(isSelected('Обзор')).toBe(true);
		key(tab('Обзор'), 'ArrowLeft');
		expect(document.activeElement).toBe(tab('Журнал'));
		expect(isSelected('Журнал')).toBe(true);
	});

	it('goes to the first and the last tab with Home and End', () => {
		render(() => (
			<Tabs.Root defaultValue='details'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
			</Tabs.Root>
		));
		tab('Детали').focus();
		key(tab('Детали'), 'End');
		expect(document.activeElement).toBe(tab('Журнал'));
		expect(isSelected('Журнал')).toBe(true);
		key(tab('Журнал'), 'Home');
		expect(document.activeElement).toBe(tab('Обзор'));
		expect(isSelected('Обзор')).toBe(true);
	});

	it('ignores other keys and arrows with a modifier', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
			</Tabs.Root>
		));
		tab('Обзор').focus();
		expect(key(tab('Обзор'), 'ArrowDown')).toBe(true);
		expect(key(tab('Обзор'), 'ArrowRight', { ctrlKey: true })).toBe(true);
		expect(key(tab('Обзор'), 'ArrowRight', { metaKey: true })).toBe(true);
		expect(isSelected('Обзор')).toBe(true);
		expect(document.activeElement).toBe(tab('Обзор'));
	});

	it('follows the parent value and writes the new value back', () => {
		let setExternal: (next: string | null) => void = () => undefined;
		render(() => {
			const [value, setValue] = createSignal<string | null>('overview');
			setExternal = setValue;
			return (
				<Tabs.Root value={value()} onValueChange={(next) => setValue(next)}>
					<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
					<Panels/>
				</Tabs.Root>
			);
		});
		fireEvent.click(tab('Детали'));
		expect(isSelected('Детали')).toBe(true);
		setExternal('log');
		expect(isSelected('Журнал')).toBe(true);
		expect(isSelected('Детали')).toBe(false);
		expect(screen.getByRole('tabpanel').textContent).toBe('Текст журнала');
	});

	it('keeps the parent value when the parent refuses the change', () => {
		const onValueChange = vi.fn();
		render(() => (
			<Tabs.Root value='overview' onValueChange={onValueChange}>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
				<Panels/>
			</Tabs.Root>
		));
		fireEvent.click(tab('Детали'));
		expect(onValueChange).toHaveBeenCalledWith('details');
		expect(isSelected('Обзор')).toBe(true);
		expect(isSelected('Детали')).toBe(false);
		expect(screen.getByRole('tabpanel').textContent).toBe('Текст обзора');
	});

	it('treats null as a controlled empty value', () => {
		render(() => (
			<Tabs.Root value={null}>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
				<Panels/>
			</Tabs.Root>
		));
		expect(screen.getAllByRole('tab').every((item) => item.getAttribute('aria-selected') === 'false')).toBe(true);
		expect(screen.queryByRole('tabpanel')).toBeNull();
		expect(tab('Обзор').getAttribute('tabindex')).toBe('0');
	});

	it('does not mount the content of hidden panels unless keepMounted is set', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
				<Tabs.Panel value='overview'>Текст обзора</Tabs.Panel>
				<Tabs.Panel value='details' keepMounted>Текст деталей</Tabs.Panel>
				<Tabs.Panel value='log'>Текст журнала</Tabs.Panel>
			</Tabs.Root>
		));
		expect(screen.queryByText('Текст журнала')).toBeNull();
		const kept = screen.getByText('Текст деталей', { selector: '[role="tabpanel"]' });
		expect(kept.hidden).toBe(true);
		expect(document.getElementById(tab('Журнал').getAttribute('aria-controls') ?? '')?.hidden).toBe(true);
	});

	it('calls the own click and key handlers and lets them cancel the default behaviour', () => {
		const onClick = vi.fn((event: MouseEvent) => {
			event.preventDefault();
		});
		const onKeyDown = vi.fn((event: KeyboardEvent) => {
			event.preventDefault();
		});
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы' onKeyDown={onKeyDown}>
					<Tabs.Tab value='overview'>Обзор</Tabs.Tab>
					<Tabs.Tab value='details' onClick={onClick}>Детали</Tabs.Tab>
				</Tabs.List>
			</Tabs.Root>
		));
		fireEvent.click(tab('Детали'));
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(isSelected('Детали')).toBe(false);
		tab('Обзор').focus();
		key(tab('Обзор'), 'ArrowRight');
		expect(onKeyDown).toHaveBeenCalledTimes(1);
		expect(isSelected('Обзор')).toBe(true);
	});

	it('sets the kit attributes on the list and passes class and style', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Обычная'><Items/></Tabs.List>
				<Tabs.List aria-label='Большая' size='lg' class='extra' style={{ 'max-inline-size': '10rem' }}><Items/></Tabs.List>
			</Tabs.Root>
		));
		const plain = screen.getByRole('tablist', { name: 'Обычная' });
		const large = screen.getByRole('tablist', { name: 'Большая' });
		expect(plain.hasAttribute('data-s-kit')).toBe(true);
		expect(plain.hasAttribute('data-s-kit-focus-inset')).toBe(true);
		expect(plain.hasAttribute('data-s-kit-size')).toBe(false);
		expect(large.getAttribute('data-s-kit-size')).toBe('lg');
		expect(large.classList.contains('extra')).toBe(true);
		expect(large.style.maxInlineSize).toBe('10rem');
	});

	it('makes the panel focusable by default and lets tabindex be overridden', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
				<Tabs.Panel value='overview'>Текст обзора</Tabs.Panel>
				<Tabs.Panel value='details' tabindex={-1}>Текст деталей</Tabs.Panel>
			</Tabs.Root>
		));
		expect(screen.getByRole('tabpanel').getAttribute('tabindex')).toBe('0');
		expect(document.getElementById(tab('Детали').getAttribute('aria-controls') ?? '')?.getAttribute('tabindex')).toBe('-1');
	});

	it('throws a clear error outside Tabs.Root', () => {
		expect(() => render(() => <Tabs.Tab value='overview'>Обзор</Tabs.Tab>)).toThrow('Tabs.Tab');
	});

	it('moves the tab order to the first enabled tab when the selected tab is removed', () => {
		let setShown: (next: boolean) => void = () => undefined;
		render(() => {
			const [shown, setter] = createSignal(true);
			setShown = setter;
			return (
				<Tabs.Root defaultValue='overview'>
					<Tabs.List aria-label='Разделы'>
						<Show when={shown()}><Tabs.Tab value='overview'>Обзор</Tabs.Tab></Show>
						<Tabs.Tab value='details'>Детали</Tabs.Tab>
					</Tabs.List>
				</Tabs.Root>
			);
		});
		expect(tab('Детали').getAttribute('tabindex')).toBe('-1');
		setShown(false);
		expect(tab('Детали').getAttribute('tabindex')).toBe('0');
	});

	it('scrolls the list so that a focused tab that sticks out becomes visible', () => {
		render(() => (
			<Tabs.Root defaultValue='overview'>
				<Tabs.List aria-label='Разделы'><Items/></Tabs.List>
			</Tabs.Root>
		));
		const list = screen.getByRole('tablist');
		const rect = (left: number, right: number): DOMRect => (
			{ left, right, top: 0, bottom: 0, width: right - left, height: 0 } as DOMRect
		);
		list.getBoundingClientRect = () => rect(0, 100);
		tab('Журнал').getBoundingClientRect = () => rect(150, 250);
		list.scrollLeft = 0;
		fireEvent.focus(tab('Журнал'));
		expect(list.scrollLeft).toBe(150);
	});
});
