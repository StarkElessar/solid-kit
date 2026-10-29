import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox } from './checkbox';

afterEach(cleanup);

describe('Checkbox', () => {
	it('renders a native checkbox named by its label text', () => {
		render(() => <Checkbox>Согласен</Checkbox>);
		const input = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Согласен' });
		expect(input.type).toBe('checkbox');
		expect(input.checked).toBe(false);
	});

	it('works without a label when aria-label is given and renders no label text', () => {
		render(() => <Checkbox aria-label='Выбрать строку'/>);
		const input = screen.getByRole('checkbox', { name: 'Выбрать строку' });
		expect(input.closest('label')?.querySelector('[data-checkbox-label]')).toBeNull();
	});

	it('puts the kit root attributes on the label, not on the input', () => {
		render(() => <Checkbox aria-label='Флажок'/>);
		const input = screen.getByRole('checkbox');
		const root = input.closest('label');
		expect(root?.hasAttribute('data-s-kit')).toBe(true);
		expect(input.hasAttribute('data-s-kit')).toBe(false);
	});

	it('sets data-s-kit-size on the root only when size is passed', () => {
		render(() => (
			<>
				<Checkbox aria-label='Без размера'/>
				<Checkbox aria-label='Большой' size='lg'/>
			</>
		));
		expect(screen.getByRole('checkbox', { name: 'Без размера' }).closest('label')?.hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('checkbox', { name: 'Большой' }).closest('label')?.getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('shows defaultChecked and reports toggling through onCheckedChange when uncontrolled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Флажок' defaultChecked onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(true);
		expect(input.checked).toBe(true);
	});

	it('toggles when the label text is clicked', () => {
		render(() => <Checkbox>Согласен</Checkbox>);
		fireEvent.click(screen.getByText('Согласен'));
		expect(screen.getByRole<HTMLInputElement>('checkbox').checked).toBe(true);
	});

	it('shows the controlled value and follows the parent', () => {
		const [checked, setChecked] = createSignal(true);
		const onCheckedChange = vi.fn((next: boolean) => setChecked(next));
		render(() => <Checkbox aria-label='Флажок' checked={checked()} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.checked).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenLastCalledWith(false);
		expect(input.checked).toBe(false);
		setChecked(true);
		expect(input.checked).toBe(true);
	});

	it('returns to the controlled value when the parent does not accept the change', () => {
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Флажок' checked={false} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(input.checked).toBe(false);
	});

	it('sets the indeterminate property and keeps it after a click until the caller changes it', () => {
		const [indeterminate, setIndeterminate] = createSignal(true);
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Все' checked={false} indeterminate={indeterminate()} onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.indeterminate).toBe(true);
		fireEvent.click(input);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
		expect(input.indeterminate).toBe(true);
		setIndeterminate(false);
		expect(input.indeterminate).toBe(false);
	});

	it('is not indeterminate by default', () => {
		render(() => <Checkbox aria-label='Флажок'/>);
		expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(false);
	});

	it('disables the input and marks the root when disabled', () => {
		const onCheckedChange = vi.fn();
		render(() => <Checkbox aria-label='Флажок' disabled onCheckedChange={onCheckedChange}/>);
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.disabled).toBe(true);
		expect(input.closest('label')?.hasAttribute('data-disabled')).toBe(true);
		// fireEvent обходит disabled в jsdom, а нативный click() его уважает, как браузер
		input.click();
		expect(onCheckedChange).not.toHaveBeenCalled();
	});

	it('does not mark the root as disabled by default', () => {
		render(() => <Checkbox aria-label='Флажок'/>);
		expect(screen.getByRole('checkbox').closest('label')?.hasAttribute('data-disabled')).toBe(false);
	});

	it('passes native attributes to the input and class and style to the root', () => {
		render(() => (
			<Checkbox
				aria-label='Флажок'
				id='agree'
				name='agree'
				value='yes'
				aria-describedby='hint'
				aria-invalid={true}
				class='custom'
				style={{ color: 'red' }}
			/>
		));
		const input = screen.getByRole<HTMLInputElement>('checkbox');
		expect(input.id).toBe('agree');
		expect(input.name).toBe('agree');
		expect(input.value).toBe('yes');
		expect(input.getAttribute('aria-describedby')).toBe('hint');
		expect(input.getAttribute('aria-invalid')).toBe('true');
		const root = input.closest('label');
		expect(root?.classList.contains('custom')).toBe(true);
		expect(root?.style.color).toBe('red');
	});
});
