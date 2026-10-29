import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { IconButton } from './icon-button';

afterEach(cleanup);

describe('IconButton', () => {
	it('renders a native button with type=button, the kit root attribute and the accessible name', () => {
		render(() => <IconButton aria-label='Закрыть'>×</IconButton>);
		const button = screen.getByRole('button', { name: 'Закрыть' });
		expect(button.tagName).toBe('BUTTON');
		expect(button.getAttribute('type')).toBe('button');
		expect(button.hasAttribute('data-s-kit')).toBe(true);
	});

	it('is primary by default', () => {
		render(() => <IconButton aria-label='Да'>★</IconButton>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe('primary');
	});

	it.each(['primary', 'tinted', 'plain', 'danger'] as const)('sets data-variant for %s', (variant) => {
		render(() => <IconButton aria-label='Да' variant={variant}>★</IconButton>);
		expect(screen.getByRole('button').getAttribute('data-variant')).toBe(variant);
	});

	it('sets data-s-kit-size only when size is passed', () => {
		render(() => (
			<>
				<IconButton aria-label='Без размера'>★</IconButton>
				<IconButton aria-label='Большая' size='lg'>★</IconButton>
			</>
		));
		expect(screen.getByRole('button', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('button', { name: 'Большая' }).getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('does not call onClick when disabled and calls it otherwise', () => {
		const onClick = vi.fn();
		render(() => (
			<>
				<IconButton aria-label='Выключена' disabled onClick={onClick}>★</IconButton>
				<IconButton aria-label='Включена' onClick={onClick}>★</IconButton>
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
			<IconButton aria-label='Закрыть' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='b'>
				×
			</IconButton>
		));
		const button = screen.getByTestId('b');
		expect(button.classList.contains('extra')).toBe(true);
		expect(button.style.marginInlineStart).toBe('4px');
	});

	it('lets the type be overridden', () => {
		render(() => <IconButton aria-label='Отправить' type='submit'>→</IconButton>);
		expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
	});

	it('renders element children', () => {
		render(() => (
			<IconButton aria-label='Звезда'>
				<svg data-testid='icon' viewBox='0 0 1 1'/>
			</IconButton>
		));
		expect(screen.getByTestId('icon').tagName.toLowerCase()).toBe('svg');
	});

	it('does not compile without an accessible name', () => {
		// @ts-expect-error aria-label обязателен
		const withoutName = (): unknown => <IconButton>×</IconButton>;
		expect(withoutName).toBeTypeOf('function');
	});
});
