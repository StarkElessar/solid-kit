import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Field } from '../field';

import { DatePicker, type DatePickerProps } from './index';

const showPopover = vi.fn(function (this: HTMLElement) {
	this.removeAttribute('popover');
});

beforeEach(() => {
	// jsdom не реализует Popover API: «показ» снимает атрибут, чтобы содержимое панели было доступно
	showPopover.mockClear();
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = vi.fn();
	vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
	// «сегодня» зафиксировано: 3 ноября 2026; таймеры не подменяются, чтобы работали микрозадачи
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 10, 3, 12));
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

function field(): HTMLInputElement {
	return screen.getByRole('combobox');
}

function toggle(): HTMLElement {
	return screen.getByRole('button', { name: 'Открыть календарь' });
}

function dialog(): HTMLElement | null {
	return screen.queryByRole('dialog');
}

function day(label: string): HTMLElement {
	return screen.getByRole('button', { name: label });
}

function clickField(): void {
	field().focus();
	fireEvent.click(field());
}

function type(text: string): void {
	fireEvent.input(field(), { target: { value: text } });
}

function enter(): boolean {
	return fireEvent.keyDown(field(), { key: 'Enter' });
}

function title(): string {
	return document.querySelector('[aria-live]')?.textContent ?? '';
}

function focusLabel(): string {
	return document.querySelector('[data-focus-target]')?.getAttribute('aria-label') ?? '';
}

function renderPicker(props: Partial<DatePickerProps> = {}) {
	return render(() => <DatePicker {...props}/>);
}

describe('DatePicker: открытие', () => {
	it('клик по полю открывает календарь, значение не меняется', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		expect(dialog()).toBeTruthy();
		expect(screen.getByRole('group', { name: 'Календарь' })).toBeTruthy();
		expect(dialog()?.getAttribute('aria-label')).toBe('Выбор даты');
		expect(onValueChange).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(field());
	});

	it('повторный клик по полю не закрывает, клик по значку закрывает и открывает', () => {
		renderPicker();
		clickField();
		fireEvent.click(field());
		expect(dialog()).toBeTruthy();
		fireEvent.click(toggle());
		expect(dialog()).toBeNull();
		fireEvent.click(toggle());
		expect(dialog()).toBeTruthy();
		expect(title()).toBe('ноябрь 2026');
	});

	it('календарь открывается на месяце значения с выбранной датой', () => {
		renderPicker({ defaultValue: '2027-02-14' });
		clickField();
		expect(title()).toBe('февраль 2027');
		expect(day('воскресенье, 14 февраля 2027 г.').hasAttribute('data-selected')).toBe(true);
	});

	it('ArrowDown открывает календарь и переносит фокус на дату', async () => {
		renderPicker({ defaultValue: '2026-11-18' });
		field().focus();
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		expect(dialog()).toBeTruthy();
		expect(document.activeElement).toBe(day('среда, 18 ноября 2026 г.'));
	});

	it('readOnly и disabled календарь не открывают', () => {
		const first = renderPicker({ readOnly: true });
		clickField();
		fireEvent.click(toggle());
		expect(dialog()).toBeNull();
		first.unmount();
		renderPicker({ disabled: true });
		fireEvent.click(field());
		fireEvent.click(toggle());
		expect(dialog()).toBeNull();
	});

	it('open и onOpenChange: состояние ведёт родитель', () => {
		const [open, setOpen] = createSignal(false);
		const onOpenChange = vi.fn();
		render(() => <DatePicker open={open()} onOpenChange={onOpenChange}/>);
		clickField();
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(dialog()).toBeNull();
		setOpen(true);
		expect(dialog()).toBeTruthy();
	});
});

describe('DatePicker: выбор в календаре', () => {
	it('клик по дню принимает дату, обновляет текст, закрывает панель, фокус в поле', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		fireEvent.click(day('вторник, 10 ноября 2026 г.'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-10');
		expect(field().value).toBe('10.11.2026');
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(field());
	});

	it('«Сегодня» выбирает сегодняшнюю дату и закрывает панель', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange, defaultValue: '2027-02-14' });
		clickField();
		fireEvent.click(screen.getByRole('button', { name: 'Сегодня' }));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03');
		expect(field().value).toBe('03.11.2026');
		expect(dialog()).toBeNull();
	});

	it('повторный выбор той же даты закрывает панель без нового колбэка', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-18', onValueChange });
		clickField();
		fireEvent.click(day('среда, 18 ноября 2026 г.'));
		expect(dialog()).toBeNull();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('дни вне min и max и запрещённые предикатом отключены', () => {
		const onValueChange = vi.fn();
		renderPicker({ min: '2026-11-05', max: '2026-11-20', isDateDisabled: (date) => date === '2026-11-10', onValueChange });
		clickField();
		expect(day('среда, 4 ноября 2026 г.').getAttribute('aria-disabled')).toBe('true');
		expect(day('вторник, 10 ноября 2026 г.').getAttribute('aria-disabled')).toBe('true');
		fireEvent.click(day('вторник, 10 ноября 2026 г.'));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(dialog()).toBeTruthy();
	});
});

describe('DatePicker: ввод текста', () => {
	it('набранная допустимая дата показывается в календаре, значение не меняется до Enter', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		type('15.12.2026');
		expect(title()).toBe('декабрь 2026');
		expect(focusLabel()).toBe('вторник, 15 декабря 2026 г.');
		expect(onValueChange).not.toHaveBeenCalled();
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-12-15');
		expect(field().value).toBe('15.12.2026');
		expect(dialog()).toBeNull();
	});

	it('Enter с нормализацией: 3.1.2027 становится 03.01.2027', () => {
		renderPicker();
		type('3.1.2027');
		enter();
		expect(field().value).toBe('03.01.2027');
	});

	it('уход из поля принимает набранную дату и закрывает панель', () => {
		const onValueChange = vi.fn();
		render(() => (
			<>
				<DatePicker onValueChange={onValueChange}/>
				<button type='button'>Другая</button>
			</>
		));
		clickField();
		type('15.11.2026');
		screen.getByRole('button', { name: 'Другая' }).focus();
		expect(onValueChange).toHaveBeenCalledWith('2026-11-15');
		expect(dialog()).toBeNull();
	});

	it('пустой текст принимается как null', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-18', onValueChange });
		type('');
		enter();
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(field().value).toBe('');
	});

	it.each(['31.02.2026', '03.11.26', '03.11'])('невалидный текст %j откатывается', (text) => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-18', onValueChange });
		type(text);
		enter();
		expect(onValueChange).not.toHaveBeenCalled();
		expect(field().value).toBe('18.11.2026');
	});

	it('дата вне min и max или запрещённая откатывается', () => {
		const onValueChange = vi.fn();
		renderPicker({ min: '2026-11-05', isDateDisabled: (date) => date === '2026-11-10', defaultValue: '2026-11-18', onValueChange });
		type('01.11.2026');
		enter();
		type('10.11.2026');
		enter();
		expect(onValueChange).not.toHaveBeenCalled();
		expect(field().value).toBe('18.11.2026');
	});

	it('недопустимая дата не двигает календарь', () => {
		renderPicker({ min: '2026-11-05' });
		clickField();
		type('01.12.2025');
		expect(title()).toBe('ноябрь 2026');
	});

	it('Esc при закрытой панели откатывает набранное', () => {
		renderPicker({ defaultValue: '2026-11-18' });
		type('01.01.2000');
		fireEvent.keyDown(field(), { key: 'Escape' });
		expect(field().value).toBe('18.11.2026');
	});

	it('повторный Enter без правок не вызывает колбэк', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-18', onValueChange });
		enter();
		expect(onValueChange).not.toHaveBeenCalled();
	});
});

describe('DatePicker: значение', () => {
	it('внешнее изменение value обновляет текст', () => {
		const [value, setValue] = createSignal<string | null>('2026-11-18');
		render(() => <DatePicker value={value()} onValueChange={setValue}/>);
		expect(field().value).toBe('18.11.2026');
		setValue('2027-01-05');
		expect(field().value).toBe('05.01.2027');
		setValue(null);
		expect(field().value).toBe('');
	});

	it('контролируемый режим: отклонённое родителем значение возвращает прежний текст', () => {
		renderPicker({ value: '2026-11-18', onValueChange: () => undefined });
		type('20.11.2026');
		enter();
		expect(field().value).toBe('18.11.2026');
	});

	it('локаль задаёт формат текста, подсказку и календарь', () => {
		renderPicker({ locale: 'en-US', defaultValue: '2026-11-18' });
		expect(field().value).toBe('11/18/2026');
		expect(field().getAttribute('placeholder')).toBe('мм/дд/гггг');
		clickField();
		expect(title()).toBe('November 2026');
		type('12/25/2026');
		enter();
		expect(field().value).toBe('12/25/2026');
	});

	it('подсказка по умолчанию дд.мм.гггг, свой placeholder важнее', () => {
		const first = renderPicker();
		expect(field().getAttribute('placeholder')).toBe('дд.мм.гггг');
		first.unmount();
		renderPicker({ placeholder: 'Когда' });
		expect(field().getAttribute('placeholder')).toBe('Когда');
	});

	it('недопустимое value предупреждает и показывает пустое поле', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderPicker({ value: '2026-02-30', onValueChange: () => undefined });
		expect(field().value).toBe('');
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe('DatePicker: очистка, форма, подписи, Field', () => {
	it('clearable: кнопка очищает значение и текст', () => {
		const onValueChange = vi.fn();
		renderPicker({ clearable: true, defaultValue: '2026-11-18', onValueChange });
		fireEvent.click(screen.getByRole('button', { name: 'Очистить' }));
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(field().value).toBe('');
		expect(screen.queryByRole('button', { name: 'Очистить' })).toBeNull();
	});

	it('name: скрытое поле несёт ISO-значение', () => {
		renderPicker({ name: 'when', defaultValue: '2026-11-18' });
		const hidden = document.querySelector<HTMLInputElement>('input[type="hidden"]');
		expect(hidden?.name).toBe('when');
		expect(hidden?.value).toBe('2026-11-18');
		type('20.11.2026');
		enter();
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('2026-11-20');
	});

	it('labels и calendarLabels переопределяют подписи', () => {
		renderPicker({ labels: { openCalendar: 'Календарь', calendar: 'Дата' }, calendarLabels: { today: 'Today' } });
		clickField();
		expect(screen.getByRole('button', { name: 'Календарь' })).toBeTruthy();
		expect(dialog()?.getAttribute('aria-label')).toBe('Дата');
		expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
	});

	it('внутри Field: id, подпись и ошибка', () => {
		render(() => (
			<Field label='Дата рождения' error='Обязательное поле'>
				{(control) => <DatePicker {...control}/>}
			</Field>
		));
		const input = field();
		expect(screen.getByLabelText('Дата рождения')).toBe(input);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBeTruthy();
	});

	it('размер попадает на оболочку поля и в календарь', () => {
		renderPicker({ size: 'lg' });
		clickField();
		expect(field().closest('[data-s-kit-size]')?.getAttribute('data-s-kit-size')).toBe('lg');
		expect(screen.getByRole('group', { name: 'Календарь' }).getAttribute('data-s-kit-size')).toBe('lg');
	});
});

describe('DatePicker: маска ввода', () => {
	it('цифры превращаются в дату с разделителями', () => {
		renderPicker();
		type('03112026');
		expect(field().value).toBe('03.11.2026');
	});

	it('буквы и посторонние знаки не попадают в поле', () => {
		renderPicker({ defaultValue: '2026-11-03' });
		type('03.11.2026x');
		expect(field().value).toBe('03.11.2026');
		type('03.11.2026!');
		expect(field().value).toBe('03.11.2026');
	});

	it('год ровно 4 цифры, лишние цифры отбрасываются', () => {
		renderPicker();
		type('031120261');
		expect(field().value).toBe('03.11.2026');
	});

	it('вставка с другими разделителями нормализуется', () => {
		renderPicker();
		type('3/11/2026');
		expect(field().value).toBe('03.11.2026');
	});

	it('en-US: месяц первым и слэш', () => {
		renderPicker({ locale: 'en-US' });
		type('11032026');
		expect(field().value).toBe('11/03/2026');
	});

	it('набранная по маске дата принимается по Enter', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		type('03112026');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03');
	});

	it('mask={false} оставляет поле свободным', () => {
		renderPicker({ mask: false, defaultValue: '2026-11-03' });
		type('abc');
		expect(field().value).toBe('abc');
		enter();
		expect(field().value).toBe('03.11.2026');
	});
});
