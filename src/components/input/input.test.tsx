import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Input } from './input';

afterEach(cleanup);

function typeInto(input: HTMLElement, text: string): void {
	(input as HTMLInputElement).value = text;
	fireEvent.input(input);
}

describe('Input', () => {
	it('renders a native text input with the kit root attribute', () => {
		render(() => <Input aria-label='Имя'/>);
		const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Имя' });
		expect(input.tagName).toBe('INPUT');
		expect(input.type).toBe('text');
		expect(input.hasAttribute('data-s-kit')).toBe(true);
	});

	it('lets the type be overridden', () => {
		render(() => <Input aria-label='Пароль' type='password' data-testid='p'/>);
		expect(screen.getByTestId<HTMLInputElement>('p').type).toBe('password');
	});

	it('sets data-s-kit-size only when size is passed and never the native size attribute', () => {
		render(() => (
			<>
				<Input aria-label='Без размера'/>
				<Input aria-label='Большое' size='lg'/>
			</>
		));
		const plain = screen.getByRole('textbox', { name: 'Без размера' });
		const large = screen.getByRole('textbox', { name: 'Большое' });
		expect(plain.hasAttribute('data-s-kit-size')).toBe(false);
		expect(large.getAttribute('data-s-kit-size')).toBe('lg');
		expect(large.hasAttribute('size')).toBe(false);
	});

	it('shows defaultValue and reports typing through onValueChange when uncontrolled', () => {
		const onValueChange = vi.fn();
		render(() => <Input aria-label='Имя' defaultValue='Анна' onValueChange={onValueChange}/>);
		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.value).toBe('Анна');
		typeInto(input, 'Анна М');
		expect(onValueChange).toHaveBeenCalledWith('Анна М');
		expect(input.value).toBe('Анна М');
	});

	it('is empty by default', () => {
		render(() => <Input aria-label='Имя'/>);
		expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('');
	});

	it('shows the controlled value and follows the parent', () => {
		const [value, setValue] = createSignal('один');
		const onValueChange = vi.fn((next: string) => setValue(next));
		render(() => <Input aria-label='Имя' value={value()} onValueChange={onValueChange}/>);
		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.value).toBe('один');
		typeInto(input, 'два');
		expect(onValueChange).toHaveBeenLastCalledWith('два');
		expect(input.value).toBe('два');
		setValue('три');
		expect(input.value).toBe('три');
	});

	it('returns to the controlled value when the parent does not accept the change', () => {
		const onValueChange = vi.fn();
		render(() => <Input aria-label='Имя' value='закреплено' onValueChange={onValueChange}/>);
		const input = screen.getByRole<HTMLInputElement>('textbox');
		typeInto(input, 'другое');
		expect(onValueChange).toHaveBeenCalledWith('другое');
		expect(input.value).toBe('закреплено');
	});

	it('is disabled when asked to', () => {
		render(() => <Input aria-label='Имя' disabled/>);
		expect(screen.getByRole<HTMLInputElement>('textbox').disabled).toBe(true);
	});

	it('forwards native attributes, class, style and events', () => {
		const onFocus = vi.fn();
		render(() => (
			<Input
				aria-label='Почта'
				aria-invalid='true'
				placeholder='name@example.com'
				class='extra'
				style={{ 'margin-inline-start': '4px' }}
				onFocus={onFocus}
			/>
		));
		const input = screen.getByRole<HTMLInputElement>('textbox');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.placeholder).toBe('name@example.com');
		expect(input.classList.contains('extra')).toBe(true);
		expect(input.style.marginInlineStart).toBe('4px');
		fireEvent.focus(input);
		expect(onFocus).toHaveBeenCalledOnce();
	});

	it('does not accept the raw onInput handler', () => {
		// @ts-expect-error значение отдаёт onValueChange, onInput не пробрасывается
		const withOnInput = (): unknown => <Input aria-label='Имя' onInput={() => undefined}/>;
		expect(withOnInput).toBeTypeOf('function');
	});
});
