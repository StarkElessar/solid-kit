import { cleanup, fireEvent, render, screen, within } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Field } from '../field';

import { DateTimePicker, type DateTimePickerProps } from './index';

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
	return screen.getByRole('button', { name: 'Открыть выбор даты и времени' });
}

function dialog(): HTMLElement | null {
	return screen.queryByRole('dialog');
}

function day(label: string): HTMLElement {
	return screen.getByRole('button', { name: label });
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

function title(): string {
	return document.querySelector('[aria-live]')?.textContent ?? '';
}

function focusLabel(): string {
	return document.querySelector('[data-focus-target]')?.getAttribute('aria-label') ?? '';
}

function highlightedLabels(): string[] {
	return [...document.querySelectorAll('[data-highlighted]')].map((item) => item.textContent);
}

function hiddenValue(): string | undefined {
	return document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value;
}

function renderPicker(props: Partial<DateTimePickerProps> = {}) {
	return render(() => <DateTimePicker {...props}/>);
}

describe('DateTimePicker: открытие', () => {
	it('клик по полю открывает панель с календарём и колонками, значение не меняется', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		expect(dialog()).toBeTruthy();
		expect(dialog()?.getAttribute('aria-label')).toBe('Выбор даты и времени');
		expect(screen.getByRole('group', { name: 'Календарь' })).toBeTruthy();
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
		expect(title()).toBe('ноябрь 2026');
	});

	it('панель открывается на месяце значения с выбранными днём и временем', () => {
		renderPicker({ defaultValue: '2027-02-14T17:20' });
		clickField();
		expect(title()).toBe('февраль 2027');
		expect(day('воскресенье, 14 февраля 2027 г.').hasAttribute('data-selected')).toBe(true);
		expect(option('Часы', '17').getAttribute('aria-selected')).toBe('true');
		expect(option('Минуты', '20').getAttribute('aria-selected')).toBe('true');
	});

	it('ArrowDown открывает панель и переносит фокус на день календаря', async () => {
		renderPicker({ defaultValue: '2026-11-18T09:00' });
		field().focus();
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		expect(dialog()).toBeTruthy();
		expect(document.activeElement).toBe(day('среда, 18 ноября 2026 г.'));
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
		render(() => <DateTimePicker open={open()} onOpenChange={onOpenChange}/>);
		clickField();
		expect(onOpenChange).toHaveBeenCalledWith(true);
		expect(dialog()).toBeNull();
		setOpen(true);
		expect(dialog()).toBeTruthy();
	});

	it('Tab ходит по областям панели и закрывает её только на выходе', async () => {
		renderPicker({ defaultValue: '2026-11-18T09:15' });
		field().focus();
		fireEvent.keyDown(field(), { key: 'ArrowDown' });
		await Promise.resolve();
		expect(fireEvent.keyDown(day('среда, 18 ноября 2026 г.'), { key: 'Tab' })).toBe(true);
		expect(dialog()).toBeTruthy();
		const now = screen.getByRole('button', { name: 'Сейчас' });
		expect(fireEvent.keyDown(now, { key: 'Tab', shiftKey: true })).toBe(true);
		expect(fireEvent.keyDown(now, { key: 'Tab' })).toBe(false);
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(field());
	});
});

describe('DateTimePicker: выбор в панели', () => {
	it('выбор дня при пустом значении даёт 00:00 и оставляет панель открытой', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		fireEvent.click(day('вторник, 10 ноября 2026 г.'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-10T00:00');
		expect(field().value).toBe('10.11.2026 00:00');
		expect(dialog()).toBeTruthy();
	});

	it('выбор дня при непустом значении сохраняет время', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-03T14:30', onValueChange });
		clickField();
		fireEvent.click(day('вторник, 10 ноября 2026 г.'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-10T14:30');
	});

	it('выбор часа при пустом значении берёт сегодняшнюю дату и оставляет панель открытой', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		fireEvent.click(option('Часы', '09'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03T09:00');
		expect(field().value).toBe('03.11.2026 09:00');
		expect(dialog()).toBeTruthy();
	});

	it('выбор часа при непустом значении сохраняет дату и минуты', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-18T09:45', onValueChange });
		clickField();
		fireEvent.click(option('Часы', '16'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-18T16:45');
	});

	it('минуты завершают выбор: панель закрыта, фокус в поле', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-18T09:00', onValueChange });
		clickField();
		fireEvent.click(option('Минуты', '45'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-18T09:45');
		expect(field().value).toBe('18.11.2026 09:45');
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(field());
	});

	it('«Сейчас» выбирает сегодня и текущее время по шагу и закрывает панель', () => {
		const onValueChange = vi.fn();
		renderPicker({ minuteStep: 15, onValueChange });
		clickField();
		fireEvent.click(screen.getByRole('button', { name: 'Сейчас' }));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03T14:30');
		expect(dialog()).toBeNull();
	});

	it('showNow=false убирает «Сейчас», у календаря нет своего «Сегодня»', () => {
		renderPicker({ showNow: false });
		clickField();
		expect(screen.queryByRole('button', { name: 'Сейчас' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Сегодня' })).toBeNull();
	});

	it('12 часов: период завершает выбор, значение остаётся 24-часовым', () => {
		const onValueChange = vi.fn();
		renderPicker({ locale: 'en-US', defaultValue: '2026-11-03T14:30', onValueChange });
		expect(field().value).toBe('11/03/2026 2:30 PM');
		clickField();
		fireEvent.click(option('AM/PM', 'AM'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03T02:30');
		expect(field().value).toBe('11/03/2026 2:30 AM');
		expect(dialog()).toBeNull();
	});
});

describe('DateTimePicker: ввод текста', () => {
	it('набранные дата и время показываются в панели до принятия, значение не меняется', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-03T09:00', onValueChange });
		clickField();
		type('15.12.2026 17:25');
		expect(title()).toBe('декабрь 2026');
		expect(focusLabel()).toContain('15 декабря 2026');
		expect(highlightedLabels()).toEqual(expect.arrayContaining(['17', '25']));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('Enter принимает набранное и закрывает панель', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		clickField();
		type('15.12.2026 17:25');
		const notPrevented = enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-12-15T17:25');
		expect(notPrevented).toBe(false);
		expect(dialog()).toBeNull();
		expect(field().value).toBe('15.12.2026 17:25');
	});

	it('уход из поля принимает набранное', () => {
		const onValueChange = vi.fn();
		render(() => (
			<>
				<DateTimePicker onValueChange={onValueChange}/>
				<button type='button'>Другая</button>
			</>
		));
		type('15.12.2026 17:25');
		fireEvent.blur(field());
		expect(onValueChange).toHaveBeenCalledWith('2026-12-15T17:25');
	});

	it('дата без времени принимается: время прежнее, а при пустом значении 00:00', () => {
		const first = renderPicker({ defaultValue: '2026-11-03T14:30' });
		type('15.12.2026');
		enter();
		expect(field().value).toBe('15.12.2026 14:30');
		first.unmount();
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		type('15.12.2026');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-12-15T00:00');
	});

	it('время без даты, невалидный текст откатываются к тексту значения', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-03T14:30', onValueChange });
		for (const bad of ['17:25', '31.02.2026 10:00', '15.12.2026 25:00']) {
			type(bad);
			enter();
			expect(field().value).toBe('03.11.2026 14:30');
		}
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('пустой текст принимается как null', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-03T14:30', onValueChange });
		type('');
		enter();
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(field().value).toBe('');
	});

	it('Esc при закрытой панели откатывает набранное', () => {
		renderPicker({ defaultValue: '2026-11-03T14:30' });
		type('15.12.2026');
		fireEvent.keyDown(field(), { key: 'Escape' });
		expect(field().value).toBe('03.11.2026 14:30');
	});

	it('внешнее изменение значения обновляет текст', () => {
		const [value, setValue] = createSignal<string | null>('2026-11-03T14:30');
		render(() => <DateTimePicker value={value()}/>);
		setValue('2026-12-01T08:05');
		expect(field().value).toBe('01.12.2026 08:05');
	});

	it('12 часов: ввод с AM/PM', () => {
		const onValueChange = vi.fn();
		renderPicker({ locale: 'en-US', onValueChange });
		type('12/15/2026 5:25 pm');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-12-15T17:25');
	});
});

describe('DateTimePicker: ограничения', () => {
	it('дни вне min и max и запрещённые предикатом отключены', () => {
		renderPicker({
			min: '2026-11-05T00:00',
			max: '2026-11-25T23:59',
			isDateDisabled: (date) => date === '2026-11-10'
		});
		clickField();
		expect(day('среда, 4 ноября 2026 г.').getAttribute('aria-disabled')).toBe('true');
		expect(day('вторник, 10 ноября 2026 г.').getAttribute('aria-disabled')).toBe('true');
		expect(day('четверг, 26 ноября 2026 г.').getAttribute('aria-disabled')).toBe('true');
		expect(day('среда, 11 ноября 2026 г.').getAttribute('aria-disabled')).toBeNull();
	});

	it('время ограничено только в день границы', () => {
		const first = renderPicker({ defaultValue: '2026-11-05T12:00', min: '2026-11-05T09:00', max: '2026-11-20T18:00' });
		clickField();
		expect(option('Часы', '08').getAttribute('aria-disabled')).toBe('true');
		expect(option('Часы', '09').getAttribute('aria-disabled')).toBeNull();
		expect(option('Часы', '23').getAttribute('aria-disabled')).toBeNull();
		first.unmount();
		renderPicker({ defaultValue: '2026-11-10T12:00', min: '2026-11-05T09:00', max: '2026-11-20T18:00' });
		clickField();
		expect(option('Часы', '08').getAttribute('aria-disabled')).toBeNull();
		expect(option('Часы', '23').getAttribute('aria-disabled')).toBeNull();
	});

	it('isTimeDisabled действует в любой день', () => {
		renderPicker({ defaultValue: '2026-11-10T09:00', isTimeDisabled: (time) => time.startsWith('12:'), minuteStep: 30 });
		clickField();
		expect(option('Часы', '12').getAttribute('aria-disabled')).toBe('true');
		expect(option('Часы', '13').getAttribute('aria-disabled')).toBeNull();
	});

	it('смена даты подгоняет недопустимое время под ограничения новой даты', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-10T07:20', min: '2026-11-05T09:00', minuteStep: 15, onValueChange });
		clickField();
		fireEvent.click(day('четверг, 5 ноября 2026 г.'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-05T09:00');
	});

	it('выбор дня, где нет допустимого времени, игнорируется', () => {
		const onValueChange = vi.fn();
		renderPicker({ defaultValue: '2026-11-10T07:20', isTimeDisabled: () => true, onValueChange });
		clickField();
		fireEvent.click(day('среда, 11 ноября 2026 г.'));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	it('набранное значение вне границ и запрещённое предикатом не принимается', () => {
		const onValueChange = vi.fn();
		renderPicker({ min: '2026-11-05T09:00', isTimeDisabled: (time) => time === '12:00', onValueChange });
		type('05.11.2026 08:00');
		enter();
		type('10.11.2026 12:00');
		enter();
		type('01.11.2026');
		enter();
		expect(onValueChange).not.toHaveBeenCalled();
		expect(field().value).toBe('');
		type('10.11.2026 12:30');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-11-10T12:30');
	});

	it('набранная дата без времени подгоняет время под границу', () => {
		const onValueChange = vi.fn();
		renderPicker({ min: '2026-11-05T09:00', onValueChange });
		type('05.11.2026');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-11-05T09:00');
	});

	it('«Сейчас» подгоняется под ограничения сегодняшнего дня', () => {
		const onValueChange = vi.fn();
		renderPicker({ min: '2026-11-03T18:00', onValueChange });
		clickField();
		fireEvent.click(screen.getByRole('button', { name: 'Сейчас' }));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03T18:00');
	});

	it('«Сейчас» отключена, если сегодня нет допустимого времени', () => {
		renderPicker({ max: '2026-11-02T23:59' });
		clickField();
		expect(screen.getByRole('button', { name: 'Сейчас' }).hasAttribute('disabled')).toBe(true);
	});

	it('выбор часа при запрещённом сегодня берёт показанный день календаря', () => {
		const onValueChange = vi.fn();
		renderPicker({ min: '2026-11-10T00:00', onValueChange });
		clickField();
		type('12.11.2026');
		fireEvent.click(option('Часы', '09'));
		expect(onValueChange).toHaveBeenCalledWith('2026-11-12T09:00');
	});

	it('min позже max предупреждает и границы игнорируются', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderPicker({ min: '2026-11-20T00:00', max: '2026-11-05T00:00' });
		clickField();
		expect(day('среда, 4 ноября 2026 г.').getAttribute('aria-disabled')).toBeNull();
		expect(warn.mock.calls.some((call) => String(call[0]).includes('later than max'))).toBe(true);
		warn.mockRestore();
	});

	it('недопустимые value и min предупреждают', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		renderPicker({ min: '2026-11-05', defaultValue: '2026-11-05 10:00' });
		expect(warn.mock.calls.filter((call) => String(call[0]).includes('YYYY-MM-DDTHH:mm')).length).toBeGreaterThanOrEqual(2);
		expect(field().value).toBe('');
		warn.mockRestore();
	});
});

describe('DateTimePicker: очистка, форма, подписи, Field', () => {
	it('clearable: кнопка очищает значение и текст', () => {
		const onValueChange = vi.fn();
		renderPicker({ clearable: true, defaultValue: '2026-11-03T09:30', onValueChange });
		fireEvent.click(screen.getByRole('button', { name: 'Очистить' }));
		expect(onValueChange).toHaveBeenCalledWith(null);
		expect(field().value).toBe('');
		expect(screen.queryByRole('button', { name: 'Очистить' })).toBeNull();
	});

	it('name: скрытое поле несёт значение YYYY-MM-DDTHH:mm', () => {
		renderPicker({ name: 'at', defaultValue: '2026-11-03T09:30' });
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.name).toBe('at');
		expect(hiddenValue()).toBe('2026-11-03T09:30');
		type('18.11.2026 20:15');
		enter();
		expect(hiddenValue()).toBe('2026-11-18T20:15');
	});

	it('подсказка по образцу локали', () => {
		const first = renderPicker();
		expect(field().placeholder).toBe('дд.мм.гггг чч:мм');
		first.unmount();
		renderPicker({ locale: 'en-US' });
		expect(field().placeholder).toBe('мм/дд/гггг чч:мм AM/PM');
	});

	it('labels переопределяют подписи', () => {
		renderPicker({ labels: { openPicker: 'Срок', panel: 'Срок сдачи', now: 'Now', hours: 'H', minutes: 'M' } });
		clickField();
		expect(screen.getByRole('button', { name: 'Срок' })).toBeTruthy();
		expect(dialog()?.getAttribute('aria-label')).toBe('Срок сдачи');
		expect(screen.getByRole('button', { name: 'Now' })).toBeTruthy();
		expect(screen.getByRole('listbox', { name: 'H' })).toBeTruthy();
		expect(screen.getByRole('listbox', { name: 'M' })).toBeTruthy();
	});

	it('внутри Field: id, подпись и ошибка', () => {
		render(() => (
			<Field label='Срок сдачи' error='Обязательное поле'>
				{(control) => <DateTimePicker {...control}/>}
			</Field>
		));
		const input = field();
		expect(screen.getByLabelText('Срок сдачи')).toBe(input);
		expect(input.getAttribute('aria-invalid')).toBe('true');
		expect(input.getAttribute('aria-describedby')).toBeTruthy();
	});

	it('клик по подписи Field фокусирует поле и не открывает панель', async () => {
		render(() => (
			<Field label='Срок сдачи'>
				{(control) => <DateTimePicker {...control}/>}
			</Field>
		));
		fireEvent.click(screen.getByText('Срок сдачи'));
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 0);
		});
		expect(dialog()).toBeNull();
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

describe('DateTimePicker: маска ввода', () => {
	it('цифры превращаются в дату и время', () => {
		renderPicker();
		type('031120261430');
		expect(field().value).toBe('03.11.2026 14:30');
	});

	it('после года ставится пробел, дальше идёт время', () => {
		renderPicker();
		type('03112026');
		expect(field().value).toBe('03.11.2026 ');
		type('03.11.2026 9');
		expect(field().value).toBe('03.11.2026 09:');
	});

	it('буквы не попадают в поле', () => {
		renderPicker();
		type('мусор');
		expect(field().value).toBe('');
		type('03.11.2026 14:30z');
		expect(field().value).toBe('03.11.2026 14:30');
	});

	it('набранное по маске принимается по Enter', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		type('031120261430');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03T14:30');
	});

	it('дата без времени с хвостовым пробелом принимается', () => {
		const onValueChange = vi.fn();
		renderPicker({ onValueChange });
		type('03112026');
		enter();
		expect(onValueChange).toHaveBeenCalledWith('2026-11-03T00:00');
	});

	it('en-US: 12 часов с периодом', () => {
		renderPicker({ locale: 'en-US' });
		type('110320262 30pm');
		expect(field().value).toBe('11/03/2026 2:30 pm');
	});

	it('mask={false} оставляет поле свободным', () => {
		renderPicker({ mask: false });
		type('мусор');
		expect(field().value).toBe('мусор');
	});
});
