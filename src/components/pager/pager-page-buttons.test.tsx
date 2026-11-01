import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPageItems } from './get-page-items';
import { PagerPageButtons } from './pager-page-buttons';

afterEach(cleanup);

function renderButtons(current: number, count: number, onSelect = vi.fn(), disabled = false) {
	return render(() => (
		<PagerPageButtons
			items={getPageItems(current, count)}
			current={current}
			pageLabel={(page) => `Страница ${page}`}
			disabled={disabled}
			size={undefined}
			onSelect={onSelect}
		/>
	));
}

describe('PagerPageButtons', () => {
	it('кнопки страниц, у текущей aria-current, многоточие не кнопка и скрыто', () => {
		const { container } = renderButtons(10, 20);
		const buttons = screen.getAllByRole('button');
		expect(buttons.map((button) => button.textContent)).toEqual(['1', '9', '10', '11', '20']);
		expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
			'Страница 1',
			'Страница 9',
			'Страница 10',
			'Страница 11',
			'Страница 20'
		]);
		expect(screen.getByRole('button', { name: 'Страница 10' }).getAttribute('aria-current')).toBe('page');
		expect(screen.getByRole('button', { name: 'Страница 9' }).hasAttribute('aria-current')).toBe(false);
		const gaps = container.querySelectorAll('[data-pager-gap]');
		expect(gaps).toHaveLength(2);
		expect([...gaps].every((gap) => gap.getAttribute('aria-hidden') === 'true')).toBe(true);
	});

	it('клик по странице зовёт onSelect', () => {
		const onSelect = vi.fn();
		renderButtons(10, 20, onSelect);
		fireEvent.click(screen.getByRole('button', { name: 'Страница 11' }));
		expect(onSelect).toHaveBeenCalledWith(11);
	});

	it('disabled отключает все кнопки', () => {
		renderButtons(1, 3, vi.fn(), true);
		expect(screen.getAllByRole('button').every((button) => (button as HTMLButtonElement).disabled)).toBe(true);
	});

	it('кнопка той же страницы не пересоздаётся при смене текущей: фокус сохраняется', () => {
		const [current, setCurrent] = createSignal(10);
		render(() => (
			<PagerPageButtons
				items={getPageItems(current(), 20)}
				current={current()}
				pageLabel={(page) => `Страница ${page}`}
				disabled={false}
				size={undefined}
				onSelect={vi.fn()}
			/>
		));
		const eleven = screen.getByRole('button', { name: 'Страница 11' });
		eleven.focus();
		setCurrent(11);
		expect(screen.getByRole('button', { name: 'Страница 11' })).toBe(eleven);
		expect(document.activeElement).toBe(eleven);
		expect(eleven.getAttribute('aria-current')).toBe('page');
	});
});
