import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';

import { Button } from '../button';

import { ButtonGroup } from './button-group';

afterEach(cleanup);

describe('ButtonGroup', () => {
	it('renders a group with the kit root attributes and the inset focus ring marker', () => {
		render(() => (
			<ButtonGroup aria-label='Период'>
				<Button variant='plain'>День</Button>
				<Button variant='plain'>Неделя</Button>
			</ButtonGroup>
		));
		const group = screen.getByRole('group', { name: 'Период' });
		expect(group.tagName).toBe('DIV');
		expect(group.hasAttribute('data-s-kit')).toBe(true);
		expect(group.hasAttribute('data-s-kit-focus-inset')).toBe(true);
	});

	it('renders the buttons in order and keeps them clickable controls', () => {
		render(() => (
			<ButtonGroup aria-label='Период'>
				<Button variant='plain'>День</Button>
				<Button variant='plain'>Неделя</Button>
				<Button variant='plain'>Месяц</Button>
			</ButtonGroup>
		));
		const names = screen.getAllByRole('button').map((button) => button.textContent);
		expect(names).toEqual(['День', 'Неделя', 'Месяц']);
	});

	it('sets data-s-kit-size only when size is passed', () => {
		render(() => (
			<>
				<ButtonGroup aria-label='Без размера'><Button variant='plain'>А</Button></ButtonGroup>
				<ButtonGroup aria-label='Малая' size='sm'><Button variant='plain'>Б</Button></ButtonGroup>
			</>
		));
		expect(screen.getByRole('group', { name: 'Без размера' }).hasAttribute('data-s-kit-size')).toBe(false);
		expect(screen.getByRole('group', { name: 'Малая' }).getAttribute('data-s-kit-size')).toBe('sm');
	});

	it('forwards class, style and native attributes', () => {
		render(() => (
			<ButtonGroup aria-label='Период' class='extra' style={{ 'margin-inline-start': '4px' }} data-testid='group'>
				<Button variant='plain'>День</Button>
			</ButtonGroup>
		));
		const group = screen.getByTestId('group');
		expect(group.classList.contains('extra')).toBe(true);
		expect(group.style.marginInlineStart).toBe('4px');
	});

	it('lets the role be overridden', () => {
		render(() => (
			<ButtonGroup role='toolbar' aria-label='Инструменты'>
				<Button variant='plain'>Один</Button>
			</ButtonGroup>
		));
		expect(screen.getByRole('toolbar', { name: 'Инструменты' })).toBeTruthy();
		expect(screen.queryByRole('group')).toBeNull();
	});
});
