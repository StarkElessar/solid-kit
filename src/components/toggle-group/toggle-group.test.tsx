import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToggleGroup } from './index';

afterEach(cleanup);

function Items(): JSX.Element {
	return (
		<>
			<ToggleGroup.Item value='day'>День</ToggleGroup.Item>
			<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
			<ToggleGroup.Item value='month'>Месяц</ToggleGroup.Item>
		</>
	);
}

function button(name: string): HTMLElement {
	return screen.getByRole('button', { name });
}

function isPressed(name: string): boolean {
	return button(name).getAttribute('aria-pressed') === 'true';
}

describe('ToggleGroup', () => {
	it('renders a labelled group of buttons with the kit root attributes', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период'>
				<Items/>
			</ToggleGroup.Root>
		));
		const group = screen.getByRole('group', { name: 'Период' });
		expect(group.hasAttribute('data-s-kit')).toBe(true);
		expect(group.hasAttribute('data-s-kit-focus-inset')).toBe(true);
		expect(screen.getAllByRole('button').map((item) => item.textContent)).toEqual(['День', 'Неделя', 'Месяц']);
	});

	it('has nothing pressed by default in single mode', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период'>
				<Items/>
			</ToggleGroup.Root>
		));
		expect(screen.getAllByRole('button').map((item) => item.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false']);
		expect(screen.getAllByRole('button').some((item) => item.hasAttribute('data-selected'))).toBe(false);
	});

	it('marks the selected item with aria-pressed and data-selected', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период' defaultValue='week'>
				<Items/>
			</ToggleGroup.Root>
		));
		expect(isPressed('Неделя')).toBe(true);
		expect(button('Неделя').hasAttribute('data-selected')).toBe(true);
		expect(isPressed('День')).toBe(false);
		expect(button('День').hasAttribute('data-selected')).toBe(false);
	});

	it('moves the selection in single mode and reports the new value', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' defaultValue='week' onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Месяц'));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith('month');
		expect(isPressed('Месяц')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
	});

	it('keeps the selection and stays silent when the selected item is clicked again in single mode', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' defaultValue='week' onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Неделя'));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(isPressed('Неделя')).toBe(true);
	});

	it('shows the controlled value and moves only when the parent accepts the change', () => {
		const [value, setValue] = createSignal<string | null>('day');
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' value={value()} onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Неделя'));
		expect(onValueChange).toHaveBeenCalledWith('week');
		expect(isPressed('День')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
		setValue('week');
		expect(isPressed('Неделя')).toBe(true);
		expect(isPressed('День')).toBe(false);
	});

	it('treats the value null as a controlled empty selection', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' value={null} onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('День'));
		expect(onValueChange).toHaveBeenCalledWith('day');
		expect(isPressed('День')).toBe(false);
	});

	it('toggles items independently in multi mode and reports the whole selection', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Дни' mode='multi' onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('День'));
		fireEvent.click(button('Месяц'));
		expect(onValueChange).toHaveBeenLastCalledWith(['day', 'month']);
		expect(isPressed('День')).toBe(true);
		expect(isPressed('Месяц')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
		fireEvent.click(button('День'));
		expect(onValueChange).toHaveBeenLastCalledWith(['month']);
		expect(isPressed('День')).toBe(false);
	});

	it('shows defaultValue in multi mode', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Дни' mode='multi' defaultValue={['day', 'month']}>
				<Items/>
			</ToggleGroup.Root>
		));
		expect(isPressed('День')).toBe(true);
		expect(isPressed('Неделя')).toBe(false);
		expect(isPressed('Месяц')).toBe(true);
	});

	it('follows the controlled array in multi mode', () => {
		const [value, setValue] = createSignal<readonly string[]>(['day']);
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Дни' mode='multi' value={value()} onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('Неделя'));
		expect(onValueChange).toHaveBeenCalledWith(['day', 'week']);
		expect(isPressed('Неделя')).toBe(false);
		setValue(['week']);
		expect(isPressed('Неделя')).toBe(true);
		expect(isPressed('День')).toBe(false);
	});

	it('disables every item when the group is disabled', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' disabled onValueChange={onValueChange}>
				<Items/>
			</ToggleGroup.Root>
		));
		const items = screen.getAllByRole<HTMLButtonElement>('button');
		expect(items.every((item) => item.disabled)).toBe(true);
		fireEvent.click(button('День'));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('disables a single item', () => {
		const onValueChange = vi.fn();
		render(() => (
			<ToggleGroup.Root aria-label='Период' onValueChange={onValueChange}>
				<ToggleGroup.Item value='day' disabled>День</ToggleGroup.Item>
				<ToggleGroup.Item value='week'>Неделя</ToggleGroup.Item>
			</ToggleGroup.Root>
		));
		fireEvent.click(button('День'));
		expect(onValueChange).not.toHaveBeenCalled();
		fireEvent.click(button('Неделя'));
		expect(onValueChange).toHaveBeenCalledWith('week');
	});

	it('sets data-s-kit-size on the group only when size is passed', () => {
		render(() => (
			<>
				<ToggleGroup.Root aria-label='Без размера'><Items/></ToggleGroup.Root>
				<ToggleGroup.Root aria-label='Малая' size='sm'><Items/></ToggleGroup.Root>
			</>
		));
		expect(screen.getByRole('group', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('group', { name: 'Малая' }).getAttribute('data-s-kit-size')).toBe('sm');
	});

	it('passes class, style and native attributes through to the group and to an item', () => {
		render(() => (
			<ToggleGroup.Root aria-label='Период' class='custom' style={{ color: 'red' }} data-testid='group'>
				<ToggleGroup.Item value='day' class='mine' data-testid='item'>День</ToggleGroup.Item>
			</ToggleGroup.Root>
		));
		const group = screen.getByTestId('group');
		expect(group.classList.contains('custom')).toBe(true);
		expect(group.style.color).toBe('red');
		const item = screen.getByTestId('item');
		expect(item.classList.contains('mine')).toBe(true);
		expect(item.tagName).toBe('BUTTON');
	});

	it('throws a clear error when an item is rendered outside the group', () => {
		expect(() => render(() => <ToggleGroup.Item value='day'>День</ToggleGroup.Item>)).toThrow('ToggleGroup.Item');
	});
});
