import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { installListGeometry } from '../../internal/testing/list-geometry';

import { Pager, type PagerProps } from './index';

const showPopover = vi.fn(function (this: HTMLElement) {
	this.removeAttribute('popover');
});

beforeEach(() => {
	// jsdom не реализует Popover API: «показ» снимает атрибут, чтобы содержимое списка было доступно
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = vi.fn();
	installListGeometry({ rowHeight: 20, viewportHeight: 100 });
	vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
});

afterEach(cleanup);

function plain(text: string | null | undefined): string {
	return (text ?? '').replace(/\s/g, ' ');
}

function button(name: string): HTMLButtonElement {
	return screen.getByRole('button', { name });
}

function current(): string {
	return document.querySelector('[aria-current="page"]')?.textContent ?? '';
}

function summary(): string {
	return plain(document.querySelector('[data-pager-summary]')?.textContent);
}

function renderPager(props: Partial<PagerProps> = {}) {
	return render(() => <Pager total={1250} defaultPageSize={20} {...props}/>);
}

describe('Pager: разметка', () => {
	it('nav с подписью, кнопки с русскими подписями, сводка и размер страницы', () => {
		renderPager({ onRefresh: vi.fn() });
		expect(screen.getByRole('navigation', { name: 'Постраничная навигация' })).toBeTruthy();
		for (const name of ['В начало', 'Назад', 'Вперёд', 'В конец', 'Обновить', 'Страница 1']) {
			expect(button(name)).toBeTruthy();
		}
		expect(summary()).toBe('Записей 1–20 из 1 250');
		expect(screen.getByRole('combobox', { name: 'Размер страницы' }).textContent).toBe('20');
		expect(screen.getByRole('navigation').hasAttribute('data-s-kit-focus-inset')).toBe(true);
	});

	it('«Обновить» только при onRefresh', () => {
		renderPager();
		expect(screen.queryByRole('button', { name: 'Обновить' })).toBeNull();
	});

	it('labels и summaryText переопределяют тексты', () => {
		renderPager({
			labels: { navigation: 'Pages', next: 'Next', page: (page) => `P${page}` },
			summaryText: (range) => `${range.from}-${range.to}/${range.total}`
		});
		expect(screen.getByRole('navigation', { name: 'Pages' })).toBeTruthy();
		expect(button('Next')).toBeTruthy();
		expect(button('P1')).toBeTruthy();
		expect(summary()).toBe('1-20/1250');
	});

	it('размер вне списка остаётся выбираемым значением', () => {
		renderPager({ defaultPageSize: 25 });
		expect(screen.getByRole('combobox').textContent).toBe('25');
	});
});

describe('Pager: навигация', () => {
	it('на первой странице «В начало» и «Назад» недоступны, на последней «Вперёд» и «В конец»', () => {
		renderPager({ defaultPage: 1 });
		expect(button('В начало').disabled).toBe(true);
		expect(button('Назад').disabled).toBe(true);
		expect(button('Вперёд').disabled).toBe(false);
		cleanup();
		renderPager({ defaultPage: 63 });
		expect(button('Вперёд').disabled).toBe(true);
		expect(button('В конец').disabled).toBe(true);
		expect(button('Назад').disabled).toBe(false);
	});

	it('кнопки двигают страницу и зовут onPageChange', () => {
		const onPageChange = vi.fn<(page: number) => void>();
		renderPager({ onPageChange });
		fireEvent.click(button('Вперёд'));
		expect(current()).toBe('2');
		fireEvent.click(button('Страница 3'));
		expect(current()).toBe('3');
		fireEvent.click(button('Назад'));
		expect(current()).toBe('2');
		fireEvent.click(button('В конец'));
		expect(current()).toBe('63');
		fireEvent.click(button('В начало'));
		expect(current()).toBe('1');
		expect(onPageChange.mock.calls.map(([page]) => page)).toEqual([2, 3, 2, 63, 1]);
	});

	it('клик по текущей странице колбэк не зовёт', () => {
		const onPageChange = vi.fn();
		renderPager({ onPageChange });
		fireEvent.click(button('Страница 1'));
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('контролируемая страница меняется только вместе с пропом', () => {
		const onPageChange = vi.fn();
		const [page, setPage] = createSignal(1);
		render(() => <Pager total={1250} page={page()} defaultPageSize={20} onPageChange={onPageChange}/>);
		fireEvent.click(button('Вперёд'));
		expect(onPageChange).toHaveBeenCalledWith(2);
		expect(current()).toBe('1');
		setPage(2);
		expect(current()).toBe('2');
	});

	it('страница за границами показывается зажатой без вызова колбэка', () => {
		const onPageChange = vi.fn();
		const [total, setTotal] = createSignal(1000);
		render(() => <Pager total={total()} page={50} defaultPageSize={10} onPageChange={onPageChange}/>);
		expect(current()).toBe('50');
		setTotal(25);
		expect(current()).toBe('3');
		expect(summary()).toBe('Записей 21–25 из 25');
		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('пустая выборка: одна страница, навигация недоступна, сводка «Записей 0»', () => {
		renderPager({ total: 0 });
		for (const name of ['В начало', 'Назад', 'Вперёд', 'В конец']) {
			expect(button(name).disabled).toBe(true);
		}
		expect(summary()).toBe('Записей 0');
		expect(current()).toBe('1');
	});
});

describe('Pager: размер страницы', () => {
	function chooseNext(): void {
		const trigger = screen.getByRole('combobox');
		trigger.focus();
		fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		fireEvent.keyDown(trigger, { key: 'Enter' });
	}

	it('смена размера зовёт onPageSizeChange, затем onPageChange с сохранением первой записи', () => {
		const order: string[] = [];
		renderPager({
			total: 1000,
			defaultPage: 3,
			defaultPageSize: 10,
			pageSizes: [10, 20, 50],
			onPageSizeChange: (size) => order.push(`size ${size}`),
			onPageChange: (page) => order.push(`page ${page}`)
		});
		chooseNext();
		expect(screen.getByRole('combobox').textContent).toBe('20');
		expect(current()).toBe('2');
		expect(order).toEqual(['size 20', 'page 2']);
	});

	it('если страница не меняется, onPageChange не зовётся', () => {
		const onPageChange = vi.fn();
		renderPager({ total: 1000, defaultPage: 1, defaultPageSize: 10, pageSizes: [10, 20, 50], onPageChange });
		chooseNext();
		expect(screen.getByRole('combobox').textContent).toBe('20');
		expect(onPageChange).not.toHaveBeenCalled();
	});
});

describe('Pager: загрузка и фокус', () => {
	it('loading отключает всё, включая размер и «Обновить», и вращает значок', () => {
		const { container } = renderPager({ loading: true, onRefresh: vi.fn(), defaultPage: 3 });
		for (const element of screen.getAllByRole('button')) {
			expect((element as HTMLButtonElement).disabled).toBe(true);
		}
		expect(screen.getByRole('combobox').hasAttribute('disabled')).toBe(true);
		expect(container.querySelector('[data-pager-refresh] svg')?.getAttribute('class')).toBeTruthy();
	});

	it('«Вперёд» на предпоследней странице: фокус уходит на кнопку текущей страницы', () => {
		renderPager({ total: 30, defaultPageSize: 10, defaultPage: 2 });
		const next = button('Вперёд');
		next.focus();
		fireEvent.click(next);
		expect(next.disabled).toBe(true);
		expect(document.activeElement).toBe(button('Страница 3'));
	});

	it('фокус не уходит со своего места, если пользователь был вне пейджера', () => {
		const outside = document.createElement('input');
		document.body.append(outside);
		renderPager({ total: 30, defaultPageSize: 10, defaultPage: 2 });
		fireEvent.click(button('Вперёд'));
		outside.focus();
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});

	it('на время загрузки фокус держит корень, после загрузки возвращается на ту же кнопку', () => {
		const [loading, setLoading] = createSignal(false);
		render(() => <Pager total={100} defaultPageSize={10} defaultPage={5} loading={loading()}/>);
		const next = button('Вперёд');
		next.focus();
		setLoading(true);
		expect(document.activeElement).toBe(screen.getByRole('navigation'));
		setLoading(false);
		expect(document.activeElement).toBe(next);
	});

	it('загрузка, закончившаяся на границе: фокус на текущей странице', () => {
		const [loading, setLoading] = createSignal(false);
		const [page, setPage] = createSignal(9);
		render(() => <Pager total={100} defaultPageSize={10} page={page()} loading={loading()}/>);
		const next = button('Вперёд');
		next.focus();
		setLoading(true);
		setPage(10);
		setLoading(false);
		expect(next.disabled).toBe(true);
		expect(document.activeElement).toBe(button('Страница 10'));
	});
});
