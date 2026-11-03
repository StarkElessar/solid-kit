import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Calendar, type CalendarProps } from './index';

afterEach(cleanup);

function renderCalendar(props: Partial<CalendarProps> = {}) {
	return render(() => <Calendar today='2026-11-02' {...props}/>);
}

function dayButtons(): HTMLButtonElement[] {
	return [...document.querySelectorAll<HTMLButtonElement>('[role="gridcell"] button')];
}

function title(): string {
	return document.querySelector('[aria-live]')?.textContent ?? '';
}

function button(name: string): HTMLButtonElement {
	const element = screen.getByRole('button', { name });
	if (!(element instanceof HTMLButtonElement)) {
		throw new TypeError(`Элемент «${name}» не кнопка`);
	}
	return element;
}

const day = button;

const NOV_15 = 'воскресенье, 15 ноября 2026 г.';
const OCT_26 = 'понедельник, 26 октября 2026 г.';

describe('Calendar: разметка', () => {
	it('показывает ноябрь 2026: 42 ячейки, 7 заголовков, 7 рядов, подпись периода', () => {
		renderCalendar();
		expect(dayButtons()).toHaveLength(42);
		expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']);
		expect(screen.getAllByRole('row')).toHaveLength(7);
		expect(title()).toBe('ноябрь 2026');
		expect(screen.getByRole('group', { name: 'Календарь' }).hasAttribute('data-s-kit')).toBe(true);
		expect(dayButtons()[0]?.getAttribute('aria-label')).toBe(OCT_26);
	});

	it.each(['2026-11-10', '2027-02-10', '2026-03-10', '2026-08-10', '2024-02-10', '2026-05-10'])(
		'всегда 42 ячейки: %s',
		(date) => {
			renderCalendar({ focusedDate: date });
			expect(dayButtons()).toHaveLength(42);
		}
	);

	it('дни соседних месяцев помечены data-outside, дни месяца нет', () => {
		renderCalendar();
		const outside = dayButtons().map((button) => button.hasAttribute('data-outside'));
		expect(outside.filter(Boolean)).toHaveLength(12);
		expect(outside.slice(0, 6).every(Boolean)).toBe(true);
		expect(outside.slice(6, 36).some(Boolean)).toBe(false);
		expect(outside.slice(36).every(Boolean)).toBe(true);
	});

	it('сегодня помечено aria-current и data-today', () => {
		renderCalendar();
		const today = day('понедельник, 2 ноября 2026 г.');
		expect(today.getAttribute('aria-current')).toBe('date');
		expect(today.hasAttribute('data-today')).toBe(true);
		expect(document.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
	});

	it('firstDayOfWeek и locale меняют заголовки', () => {
		const first = renderCalendar({ firstDayOfWeek: 0 });
		expect(screen.getAllByRole('columnheader')[0]?.textContent).toBe('Вс');
		expect(dayButtons()[0]?.getAttribute('aria-label')).toBe('воскресенье, 1 ноября 2026 г.');
		first.unmount();
		renderCalendar({ locale: 'en-US' });
		expect(screen.getAllByRole('columnheader')[0]?.textContent).toBe('Sun');
		expect(title()).toBe('November 2026');
	});

	it('labels переопределяют подписи', () => {
		renderCalendar({ labels: { today: 'Today', calendar: 'Date', next: () => 'Вперёд' } });
		expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
		expect(screen.getByRole('group', { name: 'Date' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Вперёд' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Предыдущий месяц' })).toBeTruthy();
	});

	it('size попадает в data-s-kit-size корня', () => {
		renderCalendar({ size: 'lg' });
		expect(screen.getByRole('group').getAttribute('data-s-kit-size')).toBe('lg');
	});
});

describe('Calendar: выбор', () => {
	it('uncontrolled: клик выбирает дату и вызывает onValueChange', () => {
		const onValueChange = vi.fn();
		renderCalendar({ onValueChange });
		fireEvent.click(day(NOV_15));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-15');
		expect(day(NOV_15).closest('[role="gridcell"]')?.getAttribute('aria-selected')).toBe('true');
		expect(day(NOV_15).hasAttribute('data-selected')).toBe(true);
		expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
	});

	it('defaultValue выбирает дату и ведёт показ к её месяцу', () => {
		renderCalendar({ defaultValue: '2027-02-14' });
		expect(title()).toBe('февраль 2027');
		expect(day('воскресенье, 14 февраля 2027 г.').hasAttribute('data-selected')).toBe(true);
	});

	it('повторный клик по выбранной дате снова вызывает колбэк и не сбрасывает значение', () => {
		const onValueChange = vi.fn();
		renderCalendar({ defaultValue: '2026-11-15', onValueChange });
		fireEvent.click(day(NOV_15));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-15');
		expect(day(NOV_15).hasAttribute('data-selected')).toBe(true);
	});

	it('клик по дню соседнего месяца выбирает дату и переключает месяц', () => {
		const onValueChange = vi.fn();
		renderCalendar({ onValueChange });
		fireEvent.click(day(OCT_26));
		expect(onValueChange).toHaveBeenCalledWith('2026-10-26');
		expect(title()).toBe('октябрь 2026');
		expect(day(OCT_26).hasAttribute('data-selected')).toBe(true);
		expect(dayButtons()).toHaveLength(42);
	});

	it('controlled: значение меняется только вместе с пропсом', () => {
		const [value, setValue] = createSignal<string | null>('2026-11-03');
		render(() => <Calendar today='2026-11-02' value={value()} onValueChange={() => undefined}/>);
		fireEvent.click(day(NOV_15));
		expect(day('вторник, 3 ноября 2026 г.').hasAttribute('data-selected')).toBe(true);
		expect(day(NOV_15).hasAttribute('data-selected')).toBe(false);
		setValue('2026-11-15');
		expect(day(NOV_15).hasAttribute('data-selected')).toBe(true);
	});

	it('value={null} это контролируемое «пусто»', () => {
		renderCalendar({ value: null, onValueChange: () => undefined });
		fireEvent.click(day(NOV_15));
		expect(document.querySelector('[aria-selected="true"]')).toBeNull();
	});

	it('после выбора фокус остаётся на выбранной дате', async () => {
		renderCalendar();
		fireEvent.click(day(OCT_26));
		await Promise.resolve();
		expect(document.activeElement).toBe(day(OCT_26));
	});
});

describe('Calendar: фокус и период', () => {
	it('roving tabindex: 0 только у сфокусированной даты', () => {
		renderCalendar({ defaultValue: '2026-11-15' });
		const stops = dayButtons().filter((button) => button.tabIndex === 0);
		expect(stops).toHaveLength(1);
		expect(stops[0]).toBe(day(NOV_15));
	});

	it('без значения фокус на сегодня; defaultFocusedDate сильнее значения', () => {
		const first = renderCalendar();
		expect(dayButtons().find((button) => button.tabIndex === 0)).toBe(day('понедельник, 2 ноября 2026 г.'));
		first.unmount();
		renderCalendar({ defaultValue: '2026-11-15', defaultFocusedDate: '2026-12-20' });
		expect(title()).toBe('декабрь 2026');
	});

	it('стрелки шапки двигают месяц и сообщают о новой дате фокуса', () => {
		const onFocusedDateChange = vi.fn();
		renderCalendar({ defaultFocusedDate: '2026-01-31', onFocusedDateChange });
		fireEvent.click(screen.getByRole('button', { name: 'Следующий месяц' }));
		expect(title()).toBe('февраль 2026');
		expect(onFocusedDateChange).toHaveBeenLastCalledWith('2026-02-28');
		fireEvent.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));
		fireEvent.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));
		expect(title()).toBe('декабрь 2025');
		expect(dayButtons()).toHaveLength(42);
	});

	it('стрелки шапки значение не меняют', () => {
		const onValueChange = vi.fn();
		renderCalendar({ defaultValue: '2026-11-15', onValueChange });
		fireEvent.click(screen.getByRole('button', { name: 'Следующий месяц' }));
		expect(onValueChange).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));
		expect(day(NOV_15).hasAttribute('data-selected')).toBe(true);
	});

	it('controlled focusedDate: показ меняется только вместе с пропсом', () => {
		const [focused, setFocused] = createSignal('2026-11-10');
		const onFocusedDateChange = vi.fn();
		render(() => <Calendar today='2026-11-02' focusedDate={focused()} onFocusedDateChange={onFocusedDateChange}/>);
		fireEvent.click(screen.getByRole('button', { name: 'Следующий месяц' }));
		expect(onFocusedDateChange).toHaveBeenCalledWith('2026-12-10');
		expect(title()).toBe('ноябрь 2026');
		setFocused('2026-12-10');
		expect(title()).toBe('декабрь 2026');
	});

	it('недопустимая focusedDate предупреждает и показывает сегодня', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderCalendar({ focusedDate: '2026-02-30', onFocusedDateChange: () => undefined });
		expect(title()).toBe('ноябрь 2026');
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it('autoFocus переносит фокус на сфокусированную дату', async () => {
		renderCalendar({ autoFocus: true, defaultValue: '2026-11-15' });
		await Promise.resolve();
		expect(document.activeElement).toBe(day(NOV_15));
	});

	it('без autoFocus фокус не трогается', async () => {
		renderCalendar();
		await Promise.resolve();
		expect(document.activeElement).toBe(document.body);
	});
});

describe('Calendar: «Сегодня»', () => {
	it('переносит показ и фокус к текущей дате, значение не меняет', async () => {
		const onValueChange = vi.fn();
		renderCalendar({ defaultFocusedDate: '2025-03-10', onValueChange });
		expect(title()).toBe('март 2025');
		fireEvent.click(screen.getByRole('button', { name: 'Сегодня' }));
		await Promise.resolve();
		expect(title()).toBe('ноябрь 2026');
		expect(onValueChange).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(day('понедельник, 2 ноября 2026 г.'));
		expect(document.querySelector('[aria-selected="true"]')).toBeNull();
	});

	it('отключена, когда сегодня вне диапазона', () => {
		renderCalendar({ max: '2026-10-31' });
		expect(button('Сегодня').disabled).toBe(true);
	});

	it('showToday={false} убирает подвал', () => {
		renderCalendar({ showToday: false });
		expect(screen.queryByRole('button', { name: 'Сегодня' })).toBeNull();
	});
});

describe('Calendar: ограничения', () => {
	it('min и max отключают дни вне диапазона, клик по ним ничего не выбирает', () => {
		const onValueChange = vi.fn();
		renderCalendar({ min: '2026-11-05', max: '2026-11-20', onValueChange });
		const disabled = dayButtons().filter((button) => button.getAttribute('aria-disabled') === 'true');
		expect(disabled).toHaveLength(42 - 16);
		fireEvent.click(day('среда, 4 ноября 2026 г.'));
		fireEvent.click(day('суббота, 21 ноября 2026 г.'));
		expect(onValueChange).not.toHaveBeenCalled();
		fireEvent.click(day(NOV_15));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-15');
	});

	it('стрелки шапки отключаются у границ диапазона', () => {
		renderCalendar({ min: '2026-11-01', max: '2026-11-30' });
		expect(button('Предыдущий месяц').disabled).toBe(true);
		expect(button('Следующий месяц').disabled).toBe(true);
	});

	it('фокус зажимается в диапазон', () => {
		renderCalendar({ max: '2026-10-15' });
		expect(title()).toBe('октябрь 2026');
	});

	it('isDateDisabled отключает произвольные даты', () => {
		renderCalendar({ isDateDisabled: (date) => date.endsWith('-15') });
		expect(day(NOV_15).getAttribute('aria-disabled')).toBe('true');
		expect(day('суббота, 14 ноября 2026 г.').hasAttribute('aria-disabled')).toBe(false);
	});

	it('disabled отключает всё', () => {
		const onValueChange = vi.fn();
		renderCalendar({ disabled: true, onValueChange });
		expect(dayButtons().every((button) => button.getAttribute('aria-disabled') === 'true')).toBe(true);
		fireEvent.click(day(NOV_15));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(button('Следующий месяц').disabled).toBe(true);
		expect(button('Предыдущий месяц').disabled).toBe(true);
		expect(button('Сегодня').disabled).toBe(true);
	});
});
