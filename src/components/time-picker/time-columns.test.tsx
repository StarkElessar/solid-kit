import { cleanup, fireEvent, render, screen, within } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TimeParts } from '../../utils/time/time-parts';

import { TimeColumns } from './time-columns';
import type { TimeColumnsProps } from './time-columns-props';

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

const LABELS = { hours: 'Часы', minutes: 'Минуты', period: 'AM/PM', now: 'Сейчас' };

type Extra = Partial<TimeColumnsProps>;

function setup(extra: Extra = {}) {
	const onChange = vi.fn<(time: TimeParts) => void>();
	const onFinish = vi.fn();
	render(() => (
		<TimeColumns
			value={null}
			onChange={onChange}
			onFinish={onFinish}
			hour12={false}
			minuteStep={1}
			showNow
			periodNames={['AM', 'PM']}
			labels={LABELS}
			{...extra}
		/>
	));
	return { onChange, onFinish };
}

function column(name: string): HTMLElement {
	return screen.getByRole('listbox', { name });
}

function option(columnName: string, label: string): HTMLElement {
	return within(column(columnName)).getByRole('option', { name: label });
}

function attr(element: HTMLElement, name: string): string | null {
	return element.getAttribute(name);
}

const flush = (): Promise<void> => Promise.resolve();

describe('TimeColumns: разметка', () => {
	it('24 часа: колонки часов (24 строки) и минут (60 строк), без периода', () => {
		setup();
		expect(within(column('Часы')).getAllByRole('option')).toHaveLength(24);
		expect(within(column('Минуты')).getAllByRole('option')).toHaveLength(60);
		expect(screen.queryByRole('listbox', { name: 'AM/PM' })).toBeNull();
	});

	it('шаг минут сокращает колонку', () => {
		setup({ minuteStep: 15 });
		expect(within(column('Минуты')).getAllByRole('option').map((item) => item.textContent)).toEqual(['00', '15', '30', '45']);
	});

	it('12 часов: 12, 01…11, минуты и колонка периода с названиями', () => {
		setup({ hour12: true, periodNames: ['AM', 'PM'] });
		const hours = within(column('Часы')).getAllByRole('option').map((item) => item.textContent);
		expect(hours).toEqual(['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
		expect(within(column('AM/PM')).getAllByRole('option').map((item) => item.textContent)).toEqual(['AM', 'PM']);
	});

	it('aria-selected только у строк выбранного времени', () => {
		setup({ value: { hour: 14, minute: 30 } });
		expect(attr(option('Часы', '14'), 'aria-selected')).toBe('true');
		expect(attr(option('Часы', '13'), 'aria-selected')).toBe('false');
		expect(attr(option('Минуты', '30'), 'aria-selected')).toBe('true');
		expect(attr(option('Минуты', '29'), 'aria-selected')).toBe('false');
	});

	it('12 часов: выбранные строки для 14:30 это 02, 30 и PM', () => {
		setup({ hour12: true, value: { hour: 14, minute: 30 } });
		expect(attr(option('Часы', '02'), 'aria-selected')).toBe('true');
		expect(attr(option('AM/PM', 'PM'), 'aria-selected')).toBe('true');
		expect(attr(option('AM/PM', 'AM'), 'aria-selected')).toBe('false');
	});

	it('полночь в 12-часовом виде это строка 12 и AM', () => {
		setup({ hour12: true, value: { hour: 0, minute: 5 } });
		expect(attr(option('Часы', '12'), 'aria-selected')).toBe('true');
		expect(attr(option('AM/PM', 'AM'), 'aria-selected')).toBe('true');
	});

	it('значение вне шага не выбирает ни одной строки минут', () => {
		setup({ minuteStep: 15, value: { hour: 14, minute: 7 } });
		const selected = within(column('Минуты')).getAllByRole('option').filter((item) => attr(item, 'aria-selected') === 'true');
		expect(selected).toHaveLength(0);
	});
});

describe('TimeColumns: выбор', () => {
	it('час при пустом значении даёт минуты 00 и не завершает ввод', () => {
		const { onChange, onFinish } = setup();
		fireEvent.click(option('Часы', '09'));
		expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 0 });
		expect(onFinish).not.toHaveBeenCalled();
	});

	it('минуты при пустом значении дают час 00 и завершают ввод (24 часа)', () => {
		const { onChange, onFinish } = setup();
		fireEvent.click(option('Минуты', '15'));
		expect(onChange).toHaveBeenCalledWith({ hour: 0, minute: 15 });
		expect(onFinish).toHaveBeenCalledTimes(1);
	});

	it('час сохраняет минуты, минуты сохраняют час', () => {
		const { onChange } = setup({ value: { hour: 14, minute: 30 } });
		fireEvent.click(option('Часы', '09'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 9, minute: 30 });
		fireEvent.click(option('Минуты', '45'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 14, minute: 45 });
	});

	it('повторный выбор того же времени тоже сообщает о выборе и завершении', () => {
		const { onChange, onFinish } = setup({ value: { hour: 14, minute: 30 } });
		fireEvent.click(option('Минуты', '30'));
		expect(onChange).toHaveBeenCalledWith({ hour: 14, minute: 30 });
		expect(onFinish).toHaveBeenCalledTimes(1);
	});

	it('12 часов: час сохраняет период, минуты не завершают, период завершает', () => {
		const { onChange, onFinish } = setup({ hour12: true, value: { hour: 14, minute: 30 } });
		fireEvent.click(option('Часы', '05'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 17, minute: 30 });
		fireEvent.click(option('Минуты', '10'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 14, minute: 10 });
		expect(onFinish).not.toHaveBeenCalled();
		fireEvent.click(option('AM/PM', 'AM'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 2, minute: 30 });
		expect(onFinish).toHaveBeenCalledTimes(1);
	});

	it('12 часов: полдень и полночь', () => {
		const { onChange } = setup({ hour12: true, value: { hour: 14, minute: 30 } });
		fireEvent.click(option('Часы', '12'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 12, minute: 30 });
		fireEvent.click(option('AM/PM', 'AM'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 2, minute: 30 });
	});

	it('12 часов при пустом значении: час даёт AM, период даёт 12:00', () => {
		const { onChange } = setup({ hour12: true });
		fireEvent.click(option('Часы', '03'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 3, minute: 0 });
		fireEvent.click(option('AM/PM', 'PM'));
		expect(onChange).toHaveBeenLastCalledWith({ hour: 12, minute: 0 });
	});
});

describe('TimeColumns: ограничения', () => {
	it('часы без допустимых минут и минуты недопустимого времени отключены и не выбираются', () => {
		const { onChange, onFinish } = setup({ min: { hour: 9, minute: 0 }, max: { hour: 18, minute: 0 }, minuteStep: 15 });
		expect(attr(option('Часы', '08'), 'aria-disabled')).toBe('true');
		expect(attr(option('Часы', '09'), 'aria-disabled')).toBeNull();
		expect(attr(option('Часы', '19'), 'aria-disabled')).toBe('true');
		fireEvent.click(option('Часы', '08'));
		expect(onChange).not.toHaveBeenCalled();
		expect(onFinish).not.toHaveBeenCalled();
	});

	it('минуты считаются для текущего часа', () => {
		setup({ value: { hour: 18, minute: 0 }, max: { hour: 18, minute: 30 }, minuteStep: 15 });
		expect(attr(option('Минуты', '30'), 'aria-disabled')).toBeNull();
		expect(attr(option('Минуты', '45'), 'aria-disabled')).toBe('true');
	});

	it('при пустом значении минуты считаются для часа 00', () => {
		setup({ min: { hour: 9, minute: 0 }, minuteStep: 15 });
		expect(attr(option('Минуты', '15'), 'aria-disabled')).toBe('true');
	});

	it('выбор часа подтягивает минуты, если прежние недопустимы', () => {
		const { onChange } = setup({ value: { hour: 8, minute: 15 }, min: { hour: 9, minute: 30 }, minuteStep: 15 });
		fireEvent.click(option('Часы', '09'));
		expect(onChange).toHaveBeenCalledWith({ hour: 9, minute: 30 });
	});

	it('isTimeDisabled получает HH:mm и отключает строки', () => {
		setup({ value: { hour: 12, minute: 0 }, minuteStep: 30, isTimeDisabled: (time) => time === '12:30' });
		expect(attr(option('Минуты', '30'), 'aria-disabled')).toBe('true');
		expect(attr(option('Минуты', '00'), 'aria-disabled')).toBeNull();
	});

	it('12 часов: период отключён, если в том же часе нет допустимых минут', () => {
		setup({ hour12: true, value: { hour: 10, minute: 0 }, max: { hour: 12, minute: 0 } });
		expect(attr(option('AM/PM', 'PM'), 'aria-disabled')).toBe('true');
		expect(attr(option('AM/PM', 'AM'), 'aria-disabled')).toBeNull();
	});
});

describe('TimeColumns: «Сейчас»', () => {
	it('выбирает локальное время, округлённое вниз по шагу, и завершает ввод', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 10, 3, 14, 37));
		const { onChange, onFinish } = setup({ minuteStep: 15 });
		fireEvent.click(screen.getByRole('button', { name: 'Сейчас' }));
		expect(onChange).toHaveBeenCalledWith({ hour: 14, minute: 30 });
		expect(onFinish).toHaveBeenCalledTimes(1);
	});

	it('отключена, если время не допускается', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 10, 3, 14, 37));
		const { onChange } = setup({ max: { hour: 12, minute: 0 } });
		const now = screen.getByRole('button', { name: 'Сейчас' });
		expect(now.hasAttribute('disabled') || attr(now, 'aria-disabled') === 'true').toBe(true);
		fireEvent.click(now);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('showNow=false убирает кнопку', () => {
		setup({ showNow: false });
		expect(screen.queryByRole('button', { name: 'Сейчас' })).toBeNull();
	});
});

describe('TimeColumns: фокус и клавиатура', () => {
	function stops(name: string): HTMLElement[] {
		return within(column(name)).getAllByRole('option').filter((item) => attr(item, 'tabindex') === '0');
	}

	it('в каждой колонке одна строка в порядке Tab: выбранная', () => {
		setup({ value: { hour: 14, minute: 30 } });
		expect(stops('Часы').map((item) => item.textContent)).toEqual(['14']);
		expect(stops('Минуты').map((item) => item.textContent)).toEqual(['30']);
	});

	it('при пустом значении остановка на текущем часе и минуте, округлённой по шагу', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 10, 3, 16, 44));
		setup({ minuteStep: 15 });
		expect(stops('Часы').map((item) => item.textContent)).toEqual(['16']);
		expect(stops('Минуты').map((item) => item.textContent)).toEqual(['30']);
	});

	it('цель фокуса для оболочки только у остановки колонки часов', () => {
		setup({ value: { hour: 14, minute: 30 } });
		const targets = document.querySelectorAll('[data-focus-target]');
		expect(targets).toHaveLength(1);
		expect(targets[0]).toBe(option('Часы', '14'));
	});

	it('стрелки двигают только фокус и не меняют значение', async () => {
		const { onChange } = setup({ value: { hour: 14, minute: 30 } });
		option('Часы', '14').focus();
		fireEvent.keyDown(option('Часы', '14'), { key: 'ArrowDown' });
		await flush();
		expect(document.activeElement).toBe(option('Часы', '15'));
		expect(stops('Часы').map((item) => item.textContent)).toEqual(['15']);
		fireEvent.keyDown(option('Часы', '15'), { key: 'ArrowUp' });
		await flush();
		expect(document.activeElement).toBe(option('Часы', '14'));
		expect(onChange).not.toHaveBeenCalled();
	});

	it('стрелка отменяет прокрутку страницы; на краю колонки остаётся на месте', async () => {
		setup({ value: { hour: 23, minute: 0 } });
		option('Часы', '23').focus();
		const notCancelled = fireEvent.keyDown(option('Часы', '23'), { key: 'ArrowDown' });
		await flush();
		expect(notCancelled).toBe(false);
		expect(document.activeElement).toBe(option('Часы', '23'));
	});

	it('стрелки пропускают отключённые строки', async () => {
		setup({ value: { hour: 10, minute: 0 }, isTimeDisabled: (time) => time.startsWith('11:') || time.startsWith('12:') });
		option('Часы', '10').focus();
		fireEvent.keyDown(option('Часы', '10'), { key: 'ArrowDown' });
		await flush();
		expect(document.activeElement).toBe(option('Часы', '13'));
	});

	it.each([
		['Home', '00'],
		['End', '23'],
		['PageDown', '20'],
		['PageUp', '08']
	])('%s в часах ведёт на %s', async (key, expected) => {
		setup({ value: { hour: 14, minute: 30 } });
		option('Часы', '14').focus();
		fireEvent.keyDown(option('Часы', '14'), { key });
		await flush();
		expect(document.activeElement).toBe(option('Часы', expected));
	});

	it('Left и Right переходят между колонками на их остановку', async () => {
		setup({ hour12: true, value: { hour: 14, minute: 30 } });
		option('Часы', '02').focus();
		fireEvent.keyDown(option('Часы', '02'), { key: 'ArrowRight' });
		await flush();
		expect(document.activeElement).toBe(option('Минуты', '30'));
		fireEvent.keyDown(option('Минуты', '30'), { key: 'ArrowRight' });
		await flush();
		expect(document.activeElement).toBe(option('AM/PM', 'PM'));
		fireEvent.keyDown(option('AM/PM', 'PM'), { key: 'ArrowRight' });
		await flush();
		expect(document.activeElement).toBe(option('AM/PM', 'PM'));
		fireEvent.keyDown(option('AM/PM', 'PM'), { key: 'ArrowLeft' });
		await flush();
		expect(document.activeElement).toBe(option('Минуты', '30'));
	});

	it('выбор строки, когда фокус уже в панели, переносит фокус в следующую колонку', async () => {
		setup({ value: { hour: 14, minute: 30 } });
		option('Часы', '14').focus();
		fireEvent.click(option('Часы', '09'));
		await flush();
		expect(document.activeElement).toBe(option('Минуты', '30'));
	});

	it('выбор мышью при фокусе вне панели фокус не забирает', async () => {
		const outside = document.createElement('input');
		document.body.append(outside);
		outside.focus();
		setup({ value: { hour: 14, minute: 30 } });
		fireEvent.click(option('Часы', '09'));
		await flush();
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});

	it('Alt, Ctrl и Meta не перехватываются', () => {
		setup({ value: { hour: 14, minute: 30 } });
		option('Часы', '14').focus();
		const notCancelled = fireEvent.keyDown(option('Часы', '14'), { key: 'ArrowDown', ctrlKey: true });
		expect(notCancelled).toBe(true);
	});
});

describe('TimeColumns: набранное время', () => {
	it('подсвечивает строки набранного времени и переносит остановки на них, значение не меняется', () => {
		const { onChange } = setup({ value: { hour: 14, minute: 30 }, highlighted: { hour: 9, minute: 5 } });
		expect(option('Часы', '09').hasAttribute('data-highlighted')).toBe(true);
		expect(option('Минуты', '05').hasAttribute('data-highlighted')).toBe(true);
		expect(attr(option('Часы', '09'), 'tabindex')).toBe('0');
		expect(attr(option('Часы', '14'), 'tabindex')).toBe('-1');
		expect(attr(option('Часы', '14'), 'aria-selected')).toBe('true');
		expect(onChange).not.toHaveBeenCalled();
	});
});
