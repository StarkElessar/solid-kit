import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal, type JSX } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RadioGroup } from './index';

afterEach(cleanup);

function Items(): JSX.Element {
	return (
		<>
			<RadioGroup.Item value='a'>Первый</RadioGroup.Item>
			<RadioGroup.Item value='b'>Второй</RadioGroup.Item>
			<RadioGroup.Item value='c'>Третий</RadioGroup.Item>
		</>
	);
}

function radio(name: string): HTMLInputElement {
	return screen.getByRole<HTMLInputElement>('radio', { name });
}

function checkedValues(): string[] {
	return screen.getAllByRole<HTMLInputElement>('radio').filter((item) => item.checked).map((item) => item.value);
}

describe('RadioGroup', () => {
	it('renders a labelled radiogroup with the kit root attributes and radios named by their text', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф'>
				<Items/>
			</RadioGroup.Root>
		));
		const group = screen.getByRole('radiogroup', { name: 'Тариф' });
		expect(group.hasAttribute('data-s-kit')).toBe(true);
		expect(group.getAttribute('data-orientation')).toBe('vertical');
		expect(screen.getAllByRole('radio').map((item) => item.getAttribute('value'))).toEqual(['a', 'b', 'c']);
		expect(radio('Второй').closest('label')?.hasAttribute('data-s-kit')).toBe(true);
		expect(radio('Второй').hasAttribute('data-s-kit')).toBe(false);
	});

	it('gives every radio of a group the same generated name and a different one to another group', () => {
		render(() => (
			<>
				<RadioGroup.Root aria-label='Первая'><Items/></RadioGroup.Root>
				<RadioGroup.Root aria-label='Вторая'><RadioGroup.Item value='x' aria-label='Икс'/></RadioGroup.Root>
			</>
		));
		const [first, second, third, other] = screen.getAllByRole<HTMLInputElement>('radio');
		expect(first?.name).not.toBe('');
		expect(second?.name).toBe(first?.name);
		expect(third?.name).toBe(first?.name);
		expect(other?.name).not.toBe(first?.name);
	});

	it('uses the name prop when it is given', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф' name='plan'>
				<Items/>
			</RadioGroup.Root>
		));
		expect(screen.getAllByRole<HTMLInputElement>('radio').every((item) => item.name === 'plan')).toBe(true);
	});

	it('has nothing checked by default and shows defaultValue', () => {
		render(() => (
			<>
				<RadioGroup.Root aria-label='Пустая'><Items/></RadioGroup.Root>
				<RadioGroup.Root aria-label='С выбором' defaultValue='b'>
					<RadioGroup.Item value='a' aria-label='А'/>
					<RadioGroup.Item value='b' aria-label='Б'/>
				</RadioGroup.Root>
			</>
		));
		expect(radio('Первый').checked).toBe(false);
		expect(radio('А').checked).toBe(false);
		expect(radio('Б').checked).toBe(true);
	});

	it('selects the clicked radio and reports its value when uncontrolled', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' defaultValue='a' onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		fireEvent.click(radio('Третий'));
		expect(onValueChange).toHaveBeenCalledTimes(1);
		expect(onValueChange).toHaveBeenCalledWith('c');
		expect(checkedValues()).toEqual(['c']);
	});

	it('stays silent when the checked radio is clicked again', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' defaultValue='a' onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		fireEvent.click(radio('Первый'));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(checkedValues()).toEqual(['a']);
	});

	it('shows the controlled value, goes back when the parent does not accept the change and follows the parent', () => {
		const [value, setValue] = createSignal<string | null>('a');
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' value={value()} onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		expect(checkedValues()).toEqual(['a']);
		fireEvent.click(radio('Второй'));
		expect(onValueChange).toHaveBeenCalledWith('b');
		expect(checkedValues()).toEqual(['a']);
		setValue('b');
		expect(checkedValues()).toEqual(['b']);
	});

	it('treats the value null as a controlled empty selection', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' value={null} onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		fireEvent.click(radio('Первый'));
		expect(onValueChange).toHaveBeenCalledWith('a');
		expect(checkedValues()).toEqual([]);
	});

	it('disables every radio when the group is disabled', () => {
		const onValueChange = vi.fn();
		render(() => (
			<RadioGroup.Root aria-label='Тариф' disabled onValueChange={onValueChange}>
				<Items/>
			</RadioGroup.Root>
		));
		expect(screen.getAllByRole<HTMLInputElement>('radio').every((item) => item.disabled)).toBe(true);
		expect(radio('Первый').closest('label')?.hasAttribute('data-disabled')).toBe(true);
		// fireEvent обходит disabled в jsdom, а нативный click() его уважает, как браузер
		radio('Первый').click();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('disables a single radio and leaves the others enabled', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф'>
				<RadioGroup.Item value='a' disabled>Первый</RadioGroup.Item>
				<RadioGroup.Item value='b'>Второй</RadioGroup.Item>
			</RadioGroup.Root>
		));
		expect(radio('Первый').disabled).toBe(true);
		expect(radio('Второй').disabled).toBe(false);
		expect(radio('Второй').closest('label')?.hasAttribute('data-disabled')).toBe(false);
	});

	it('sets data-s-kit-size only when size is passed and reflects the orientation', () => {
		render(() => (
			<>
				<RadioGroup.Root aria-label='Без размера'><Items/></RadioGroup.Root>
				<RadioGroup.Root aria-label='Малая' size='sm' orientation='horizontal'><Items/></RadioGroup.Root>
			</>
		));
		expect(screen.getByRole('radiogroup', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		const small = screen.getByRole('radiogroup', { name: 'Малая' });
		expect(small.getAttribute('data-s-kit-size')).toBe('sm');
		expect(small.getAttribute('data-orientation')).toBe('horizontal');
	});

	it('passes attributes to the group and native attributes to the input of an item', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф' class='custom' style={{ color: 'red' }} aria-invalid={true} data-testid='group'>
				<RadioGroup.Item value='a' id='first' aria-describedby='hint' class='mine' style={{ color: 'blue' }}>
					Первый
				</RadioGroup.Item>
			</RadioGroup.Root>
		));
		const group = screen.getByTestId('group');
		expect(group.classList.contains('custom')).toBe(true);
		expect(group.style.color).toBe('red');
		expect(group.getAttribute('aria-invalid')).toBe('true');
		const input = radio('Первый');
		expect(input.id).toBe('first');
		expect(input.getAttribute('aria-describedby')).toBe('hint');
		const root = input.closest('label');
		expect(root?.classList.contains('mine')).toBe(true);
		expect(root?.style.color).toBe('blue');
	});

	it('works without a label text when aria-label is given', () => {
		render(() => (
			<RadioGroup.Root aria-label='Тариф'>
				<RadioGroup.Item value='a' aria-label='Базовый'/>
			</RadioGroup.Root>
		));
		expect(radio('Базовый').closest('label')?.querySelector('[data-radio-label]')).toBeNull();
	});

	it('throws a clear error when an item is rendered outside the group', () => {
		expect(() => render(() => <RadioGroup.Item value='a'>Первый</RadioGroup.Item>)).toThrow('RadioGroup.Item');
	});
});
