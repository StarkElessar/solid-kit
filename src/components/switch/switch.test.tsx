import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Switch } from './switch';

afterEach(cleanup);

describe('Switch', () => {
	it('renders a native checkbox with the switch role named by its label text', () => {
		render(() => <Switch>Уведомления</Switch>);
		const input = screen.getByRole<HTMLInputElement>('switch', { name: 'Уведомления' });
		expect(input.type).toBe('checkbox');
		expect(input.checked).toBe(false);
	});

	it('works without a label when aria-label is given and renders no label text', () => {
		render(() => <Switch aria-label='Тёмная тема'/>);
		const input = screen.getByRole('switch', { name: 'Тёмная тема' });
		expect(input.closest('label')?.querySelector('[data-switch-label]')).toBeNull();
	});

	it('puts the kit root attributes on the label, not on the input', () => {
		render(() => <Switch aria-label='Переключатель'/>);
		const input = screen.getByRole('switch');
		expect(input.closest('label')?.hasAttribute('data-s-kit')).toBe(true);
		expect(input.hasAttribute('data-s-kit')).toBe(false);
	});

	it('sets data-s-kit-size on the root only when size is passed', () => {
		render(() => (
			<>
				<Switch aria-label='Без размера'/>
				<Switch aria-label='Большой' size='lg'/>
			</>
		));
		expect(screen.getByRole('switch', { name: 'Без размера' }).closest('label')?.hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('switch', { name: 'Большой' }).closest('label')?.getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('shows defaultChecked and reports toggling through onCheckedChange when uncontrolled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Switch aria-label='Переключатель' defaultChecked onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(true);
		expect(input.checked).toBe(true);
	});

	it('toggles when the label text is clicked', () => {
		render(() => <Switch>Уведомления</Switch>);
		fireEvent.click(screen.getByText('Уведомления'));
		expect(screen.getByRole<HTMLInputElement>('switch').checked).toBe(true);
	});

	it('shows the controlled value and follows the parent', () => {
		const [checked, setChecked] = createSignal(true);
		const onCheckedChange = vi.fn((next: boolean) => setChecked(next));
		render(() => <Switch aria-label='Переключатель' checked={checked()} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		setChecked(true);
		expect(input.checked).toBe(true);
	});

	it('returns to the controlled value when the parent does not accept the change', () => {
		const onCheckedChange = vi.fn();
		render(() => <Switch aria-label='Переключатель' checked={false} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(input.checked).toBe(false);
	});

	it('disables the input and marks the root when disabled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Switch aria-label='Переключатель' disabled onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.disabled).toBe(true);
		expect(input.closest('label')?.hasAttribute('data-disabled')).toBe(true);
		// fireEvent обходит disabled в jsdom, а нативный click() его уважает, как браузер
		input.click();
		expect(onCheckedChange).not.toHaveBeenCalled();
	});

	it('does not mark the root as disabled by default', () => {
		render(() => <Switch aria-label='Переключатель'/>);
		expect(screen.getByRole('switch').closest('label')?.hasAttribute('data-disabled')).toBe(false);
	});

	it('passes native attributes to the input and class and style to the root', () => {
		render(() => (
			<Switch
				aria-label='Переключатель'
				id='notify'
				name='notify'
				value='on'
				aria-describedby='hint'
				class='custom'
				style={{ color: 'red' }}
			/>
		));
		const input = screen.getByRole<HTMLInputElement>('switch');
		expect(input.id).toBe('notify');
		expect(input.name).toBe('notify');
		expect(input.value).toBe('on');
		expect(input.getAttribute('aria-describedby')).toBe('hint');
		const root = input.closest('label');
		expect(root?.classList.contains('custom')).toBe(true);
		expect(root?.style.color).toBe('red');
	});
});
