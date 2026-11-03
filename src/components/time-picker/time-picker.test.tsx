import { cleanup, fireEvent, render, screen, within } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Field } from '../field';

import { TimePicker, type TimePickerProps } from './index';

const showPopover = vi.fn(function (this: HTMLElement) {
	this.removeAttribute('popover');
});

beforeEach(() => {
	// jsdom не реализует Popover API: «показ» снимает атрибут, чтобы содержимое панели было доступно
	showPopover.mockClear();
	HTMLElement.prototype.showPopover = showPopover;
	HTMLElement.prototype.hidePopover = vi.fn();
	vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
	// «сейчас» зафиксировано: 3 ноября 2026, 14:37; таймеры не подменяются, чтобы работали микрозадачи
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date(2026, 10, 3, 14, 37));
});

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

function field(): HTMLInputElement {
	return screen.getByRole('combobox');
}

function toggle(): HTMLElement {
	return screen.getByRole('button', { name: 'Открыть выбор времени' });
}

function dialog(): HTMLElement | null {
	return screen.queryByRole('dialog');
}

function option(columnName: string, label: string): HTMLElement {
	return within(screen.getByRole('listbox', { name: columnName })).getByRole('option', { name: label });
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

function highlightedLabels(): string[] {
	return [...document.querySelectorAll('[data-highlighted]')].map((item) => item.textContent);
}

function renderPicker(props: Partial<TimePickerProps> = {}) {
	return render(() => <TimePicker {...props}/>);
}

describe('TimePicker: открытие', () => {
	it('клик по полю открывает панель, значение не меняется, курсор остаётся в поле', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		expect(dialog()).toBeTruthy();
		expect(dialog()?.getAttribute('aria-label')).toBe('Выбор времени');
		expect(screen.getByRole('listbox', { name: 'Часы' })).toBeTruthy();
		expect(screen.getByRole('listbox', { name: 'Минуты' })).toBeTruthy();
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
	});

	it('ArrowDown открывает панель и переносит фокус на строку часов', async () => {
		renderPicker({ defaultValue: '09:15' });
		field().focus();
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		expect(dialog()).toBeTruthy();
		expect(document.activeElement).toBe(option('Часы', '09'));
	});

	it('readOnly и disabled панель не открывают', () => {
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
		render(() => <TimePicker open={open()} onOpenChange={onOpenChange}/>);
		clickField();
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(dialog()).toBeNull();
		setOpen(true);
		expect(dialog()).toBeTruthy();
	});
});

describe('TimePicker: выбор в панели', () => {
	it('час обновляет значение и текст, панель остаётся открытой', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		fireEvent.click(option('Часы', '09'));
		expect(onValueChange).toHaveBeenCalledWith('09:00');
		expect(field().value).toBe('09:00');
		expect(dialog()).toBeTruthy();
	});

	it('минуты завершают выбор: панель закрыта, фокус в поле', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '09:00', onValueChange });
		clickField();
		fireEvent.click(option('Минуты', '45'));
		expect(onValueChange).toHaveBeenCalledWith('09:45');
		expect(field().value).toBe('09:45');
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(field());
	});

	it('повторный выбор того же времени закрывает панель без нового колбэка', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '09:45', onValueChange });
		clickField();
		fireEvent.click(option('Минуты', '45'));
		expect(onValueChange).not.toHaveBeenCalled();
		expect(dialog()).toBeNull();
	});

	it('«Сейчас» выбирает текущее время по шагу и закрывает панель', () => {
		const onValueChange = vi.fn();
		renderPicker({ minuteStep: 15, onValueChange });
		clickField();
		fireEvent.click(screen.getByRole('button', { name: 'Сейчас' }));
		expect(onValueChange).toHaveBeenCalledWith('14:30');
		expect(field().value).toBe('14:30');
		expect(dialog()).toBeNull();
	});

	it('showNow=false убирает «Сейчас»', () => {
		renderPicker({ showNow: false });
		clickField();
		expect(screen.queryByRole('button', { name: 'Сейчас' })).toBeNull();
	});

	it('колонки открываются с выбранным временем', () => {
		renderPicker({ defaultValue: '17:20' });
		clickField();
		expect(option('Часы', '17').getAttribute('aria-selected')).toBe('true');
		expect(option('Минуты', '20').getAttribute('aria-selected')).toBe('true');
	});

	it('12 часов: период завершает выбор, значение остаётся 24-часовым', () => {
		const onValueChange = vi.fn();
		renderPicker({ locale: 'en-US', defaultValue: '14:30', onValueChange });
		expect(field().value).toBe('2:30 PM');
		clickField();
		fireEvent.click(option('AM/PM', 'AM'));
		expect(onValueChange).toHaveBeenCalledWith('02:30');
		expect(field().value).toBe('2:30 AM');
		expect(dialog()).toBeNull();
	});

	it('время вне min и max и запрещённое предикатом отключено', () => {
		renderPicker({ min: '09:00', max: '18:00', isTimeDisabled: (time) => time.startsWith('12:'), minuteStep: 30 });
		clickField();
		expect(option('Часы', '08').getAttribute('aria-disabled')).toBe('true');
		expect(option('Часы', '12').getAttribute('aria-disabled')).toBe('true');
		expect(option('Часы', '19').getAttribute('aria-disabled')).toBe('true');
		expect(option('Часы', '10').getAttribute('aria-disabled')).toBeNull();
	});
});

describe('TimePicker: ввод текста', () => {
	it('набранное допустимое время подсвечивается в колонках, значение не меняется до Enter', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '09:00', onValueChange });
		clickField();
		type('1430');
		expect(highlightedLabels().sort()).toEqual(['14', '30']);
		expect(onValueChange).not.toHaveBeenCalled();
		enter();
		expect(onValueChange).toHaveBeenCalledWith('14:30');
		expect(field().value).toBe('14:30');
	});

	it('Enter с нормализацией: 9.5 не принимается, 930 становится 09:30', () => {
		renderPicker();
		type('930');
		enter();
		expect(field().value).toBe('09:30');
	});

	it('Enter закрывает открытую панель', () => {
		renderPicker();
		clickField();
		type('9:30');
		enter();
		expect(dialog()).toBeNull();
	});

	it('уход из поля принимает набранное время и закрывает панель', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		type('9');
		fireEvent.blur(field());
		expect(onValueChange).toHaveBeenCalledWith('09:00');
		expect(dialog()).toBeNull();
	});

	it('пустой текст принимается как null', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '09:30', onValueChange });
		type('');
		enter();
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(field().value).toBe('');
	});

	it.each(['9:5', '25:00', '12:60', 'abc', '9:30:15'])('невалидный текст %j откатывается', (text) => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '09:30', onValueChange });
		type(text);
		enter();
		expect(onValueChange).not.toHaveBeenCalled();
		expect(field().value).toBe('09:30');
	});

	it('время вне min и max или запрещённое откатывается', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '10:00', min: '09:00', max: '18:00', isTimeDisabled: (time) => time === '12:00', onValueChange });
		type('08:00');
		enter();
		type('19:00');
		enter();
		type('12:00');
		enter();
		expect(onValueChange).not.toHaveBeenCalled();
		expect(field().value).toBe('10:00');
	});

	it('время вне шага minuteStep в тексте допустимо', () => {
		const onValueChange = vi.fn();
		renderPicker({ minuteStep: 15, onValueChange });
		type('14:07');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('14:07');
	});

	it('недопустимое время не подсвечивается', () => {
		renderPicker({ min: '09:00' });
		clickField();
		type('08:00');
		expect(highlightedLabels()).toEqual([]);
	});

	it('Esc при закрытой панели откатывает набранное', () => {
		renderPicker({ defaultValue: '09:30' });
		type('1111');
		fireEvent.keyDown(field(), { key: 'Escape' });
		expect(field().value).toBe('09:30');
	});

	it('повторный Enter без правок не вызывает колбэк', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '09:30', onValueChange });
		enter();
		enter();
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('12 часов: ввод с суффиксом', () => {
		const onValueChange = vi.fn();
		renderPicker({ locale: 'en-US', onValueChange });
		type('2:30pm');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('14:30');
		expect(field().value).toBe('2:30 PM');
	});
});

describe('TimePicker: значение', () => {
	it('внешнее изменение value обновляет текст', () => {
		const [value, setValue] = createSignal<string | null>('09:30');
		render(() => <TimePicker value={value()} onValueChange={setValue}/>);
		expect(field().value).toBe('09:30');
		setValue('17:05');
		expect(field().value).toBe('17:05');
		setValue(null);
		expect(field().value).toBe('');
	});

	it('контролируемый режим: отклонённое родителем значение возвращает прежний текст', () => {
		renderPicker({ value: '09:30', onValueChange: () => undefined });
		type('10:00');
		enter();
		expect(field().value).toBe('09:30');
	});

	it('локаль и hour12 задают формат текста и подсказку', () => {
		const first = renderPicker({ locale: 'en-US', defaultValue: '14:30' });
		expect(field().value).toBe('2:30 PM');
		expect(field().getAttribute('placeholder')).toBe('чч:мм AM/PM');
		first.unmount();
		renderPicker({ locale: 'en-US', hour12: false, defaultValue: '14:30' });
		expect(field().value).toBe('14:30');
		expect(field().getAttribute('placeholder')).toBe('чч:мм');
	});

	it('подсказка по умолчанию чч:мм, свой placeholder важнее', () => {
		const first = renderPicker();
		expect(field().getAttribute('placeholder')).toBe('чч:мм');
		first.unmount();
		renderPicker({ placeholder: 'Во сколько' });
		expect(field().getAttribute('placeholder')).toBe('Во сколько');
	});

	it('недопустимое value предупреждает и показывает пустое поле', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderPicker({ value: '9:30', onValueChange: () => undefined });
		expect(field().value).toBe('');
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it('min позже max: предупреждение, ограничения игнорируются', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderPicker({ min: '18:00', max: '09:00' });
		clickField();
		expect(option('Часы', '12').getAttribute('aria-disabled')).toBeNull();
		expect(warn.mock.calls.some((call) => String(call[0]).includes('later than max'))).toBe(true);
		warn.mockRestore();
	});

	it('недопустимый min предупреждает', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderPicker({ min: '9:00' });
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});
});

describe('TimePicker: очистка, форма, подписи, Field', () => {
	it('clearable: кнопка очищает значение и текст', () => {
		const onValueChange = vi.fn();
		renderPicker({ clearable: true, defaultValue: '09:30', onValueChange });
		fireEvent.click(screen.getByRole('button', { name: 'Очистить' }));
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(field().value).toBe('');
		expect(screen.queryByRole('button', { name: 'Очистить' })).toBeNull();
	});

	it('name: скрытое поле несёт значение HH:mm', () => {
		renderPicker({ name: 'at', defaultValue: '09:30' });
		const hidden = document.querySelector<HTMLInputElement>('input[type="hidden"]');
		expect(hidden?.name).toBe('at');
		expect(hidden?.value).toBe('09:30');
		type('2015');
		enter();
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('20:15');
	});

	it('labels переопределяют подписи', () => {
		renderPicker({ labels: { openPicker: 'Часы работы', panel: 'Время', now: 'Now', hours: 'H', minutes: 'M' } });
		clickField();
		expect(screen.getByRole('button', { name: 'Часы работы' })).toBeTruthy();
		expect(dialog()?.getAttribute('aria-label')).toBe('Время');
		expect(screen.getByRole('button', { name: 'Now' })).toBeTruthy();
		expect(screen.getByRole('listbox', { name: 'H' })).toBeTruthy();
		expect(screen.getByRole('listbox', { name: 'M' })).toBeTruthy();
	});

	it('внутри Field: id, подпись и ошибка', () => {
		render(() => (
			<Field label='Время отправления' error='Обязательное поле'>
				{(control) => <TimePicker {...control}/>}
			</Field>
		));
		const input = field();
		expect(screen.getByLabelText('Время отправления')).toBe(input);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBeTruthy();
	});

	it('размер попадает на оболочку поля и в панель', () => {
		renderPicker({ size: 'lg' });
		clickField();
		expect(field().closest('[data-s-kit-size]')?.getAttribute('data-s-kit-size')).toBe('lg');
		expect(screen.getByRole('listbox', { name: 'Часы' }).closest('[data-s-kit-size]')?.getAttribute('data-s-kit-size')).toBe('lg');
	});

	it('12-часовой вид добавляет класс ширины на оболочку', () => {
		const shellClasses = (): number => (field().parentElement?.className.split(' ').length ?? 0);
		const first = renderPicker();
		const plain = shellClasses();
		first.unmount();
		renderPicker({ locale: 'en-US' });
		expect(shellClasses()).toBe(plain + 1);
	});
});
