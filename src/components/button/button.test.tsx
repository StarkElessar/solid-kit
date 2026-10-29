import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from './button';

afterEach(cleanup);

describe('Button', () => {
	it('renders a native button with type=button and the kit root attribute', () => {
		render(() => <Button>Сохранить</Button>);
		const button = screen.getByRole('button', { name: 'Сохранить' });
		expect(button.tagName).toBe('BUTTON');
		expect(button.getAttribute('type')).toBe('button');
		expect(button.hasAttribute('data-s-kit')).toBe(true);
	});

	it('is primary by default', () => {
		render(() => <Button>Да</Button>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe('primary');
	});

	it.each(['primary', 'tinted', 'plain', 'danger'] as const)('sets data-variant for %s', (variant) => {
		render(() => <Button variant={variant}>Да</Button>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe(variant);
	});

	it('sets data-s-kit-size only when size is passed', () => {
		render(() => (
			<>
				<Button>Без размера</Button>
				<Button size='lg'>Большая</Button>
			</>
		));
		expect(screen.getByRole('button', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('button', { name: 'Большая' }).getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('does not call onClick when disabled and calls it otherwise', () => {
		const onClick = vi.fn();
		render(() => (
			<>
				<Button disabled onClick={onClick}>Выключена</Button>
				<Button onClick={onClick}>Включена</Button>
			</>
		));
		const disabled = screen.getByRole<HTMLButtonElement>('button', { name: 'Выключена' });
		expect(disabled.disabled).toBe(true);
		disabled.click();
		expect(onClick).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Включена' }));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('forwards native attributes, class and style', () => {
		render(() => (
			<Button aria-label='Закрыть' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='b'>
				×
			</Button>
		));
		const button = screen.getByTestId('b');
		expect(button.getAttribute('aria-label')).toBe('Закрыть');
		expect(button.classList.contains('extra')).toBe(true);
		expect(button.style.marginInlineStart).toBe('4px');
	});

	it('lets the type be overridden', () => {
		render(() => <Button type='submit'>Отправить</Button>);
		expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
	});

	it('renders element children', () => {
		render(() => (
			<Button>
				<span data-testid='icon'>★</span> Звезда
			</Button>
		));
		expect(screen.getByTestId('icon').textContent).toBe('★');
	});
});
