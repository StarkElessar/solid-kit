import { describe, expect, it } from 'vitest';

import { hour24Of, hourRows, minuteRows, moveRow, nearestAllowedId, resolveHour } from './time-columns-state';
import type { TimeLimits } from './time-limits';

const FREE: TimeLimits = { step: 1 };
const all = () => true;

describe('hourRows и minuteRows', () => {
	it('24 часа: 00…23', () => {
		const rows = hourRows(false);
		expect(rows).toHaveLength(24);
		expect(rows[0]).toEqual({ id: 0, label: '00' });
		expect(rows[23]).toEqual({ id: 23, label: '23' });
	});

	it('12 часов: 12, 01…11, а id полудня и полуночи 0', () => {
		const rows = hourRows(true);
		expect(rows.map((row) => row.label)).toEqual(['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11']);
		expect(rows[0]?.id).toBe(0);
	});

	it('минуты по шагу с ведущими нулями', () => {
		expect(minuteRows(15).map((row) => row.label)).toEqual(['00', '15', '30', '45']);
		expect(minuteRows(1)).toHaveLength(60);
	});
});

describe('hour24Of', () => {
	it.each([
		[7, false, 0, 7],
		[7, false, 1, 7],
		[7, true, 0, 7],
		[7, true, 1, 19],
		[0, true, 0, 0],
		[0, true, 1, 12]
	] as const)('строка %i, 12ч=%s, период %i → %i', (rowId, hour12, period, expected) => {
		expect(hour24Of(rowId, hour12, period)).toBe(expected);
	});
});

describe('resolveHour', () => {
	it('оставляет минуты, если время допустимо', () => {
		expect(resolveHour(9, 45, FREE)).toEqual({ hour: 9, minute: 45 });
	});

	it('подтягивает минуты к первой допустимой, если прежние недопустимы', () => {
		const limits: TimeLimits = { step: 15, min: { hour: 9, minute: 30 } };
		expect(resolveHour(9, 15, limits)).toEqual({ hour: 9, minute: 30 });
	});

	it('минуты вне шага тоже подтягиваются, если время недопустимо', () => {
		const limits: TimeLimits = { step: 15, isDisabled: (time) => time === '09:07' };
		expect(resolveHour(9, 7, limits)).toEqual({ hour: 9, minute: 0 });
	});

	it('null, если в часе нет допустимых минут', () => {
		expect(resolveHour(8, 0, { step: 15, min: { hour: 9, minute: 0 } })).toBeNull();
		expect(resolveHour(12, 0, { step: 30, isDisabled: (time) => time.startsWith('12:') })).toBeNull();
	});

	it('учитывает max', () => {
		expect(resolveHour(18, 45, { step: 15, max: { hour: 18, minute: 30 } })).toEqual({ hour: 18, minute: 0 });
		expect(resolveHour(19, 0, { step: 15, max: { hour: 18, minute: 30 } })).toBeNull();
	});
});

describe('nearestAllowedId', () => {
	const rows = minuteRows(15);

	it('допустимая строка остаётся', () => {
		expect(nearestAllowedId(rows, 30, all)).toBe(30);
	});

	it('недопустимая заменяется ближайшей допустимой, при равенстве следующей', () => {
		expect(nearestAllowedId(rows, 30, (id) => id !== 30)).toBe(45);
		expect(nearestAllowedId(rows, 30, (id) => id === 0)).toBe(0);
		expect(nearestAllowedId(rows, 45, (id) => id === 15)).toBe(15);
	});

	it('без допустимых строк остаётся прежняя', () => {
		expect(nearestAllowedId(rows, 30, () => false)).toBe(30);
	});

	it('неизвестный id возвращается как есть', () => {
		expect(nearestAllowedId(rows, 7, all)).toBe(7);
	});
});

describe('moveRow', () => {
	const rows = hourRows(false);

	it('стрелки двигают на соседнюю допустимую строку без перехода по кругу', () => {
		expect(moveRow(rows, 5, 'ArrowDown', all)).toBe(6);
		expect(moveRow(rows, 5, 'ArrowUp', all)).toBe(4);
		expect(moveRow(rows, 23, 'ArrowDown', all)).toBeNull();
		expect(moveRow(rows, 0, 'ArrowUp', all)).toBeNull();
	});

	it('стрелки пропускают отключённые строки', () => {
		const isAllowed = (id: number) => id !== 6 && id !== 7;
		expect(moveRow(rows, 5, 'ArrowDown', isAllowed)).toBe(8);
		expect(moveRow(rows, 8, 'ArrowUp', isAllowed)).toBe(5);
	});

	it('Home и End ведут к первой и последней допустимым', () => {
		const isAllowed = (id: number) => id >= 3 && id <= 20;
		expect(moveRow(rows, 10, 'Home', isAllowed)).toBe(3);
		expect(moveRow(rows, 10, 'End', isAllowed)).toBe(20);
		expect(moveRow(rows, 3, 'Home', isAllowed)).toBeNull();
	});

	it('PageUp и PageDown сдвигают на 6 строк с зажатием по краям', () => {
		expect(moveRow(rows, 10, 'PageDown', all)).toBe(16);
		expect(moveRow(rows, 10, 'PageUp', all)).toBe(4);
		expect(moveRow(rows, 20, 'PageDown', all)).toBe(23);
		expect(moveRow(rows, 3, 'PageUp', all)).toBe(0);
		expect(moveRow(rows, 23, 'PageDown', all)).toBeNull();
	});

	it('PageDown на отключённую строку берёт ближайшую допустимую дальше, а без неё последнюю допустимую', () => {
		expect(moveRow(rows, 10, 'PageDown', (id) => id !== 16)).toBe(17);
		expect(moveRow(rows, 10, 'PageDown', (id) => id <= 12)).toBe(12);
	});

	it('прочие клавиши и пустое направление дают null', () => {
		expect(moveRow(rows, 5, 'a', all)).toBeNull();
		expect(moveRow(rows, 5, 'ArrowDown', () => false)).toBeNull();
	});
});
