import { describe, expect, it } from 'vitest';

import { findEnabledDate, MAX_SKIP } from './find-enabled-date';

const d = (year: number, month: number, day: number) => ({ year, month, day });
const always = () => true;

describe('findEnabledDate', () => {
	it('возвращает старт, если он доступен', () => {
		expect(findEnabledDate(d(2026, 11, 10), 1, 'days', () => false, always)).toEqual(d(2026, 11, 10));
	});

	it('пропускает отключённые дни в направлении', () => {
		const disabled = (date: { day: number }) => date.day >= 11 && date.day <= 13;
		expect(findEnabledDate(d(2026, 11, 11), 1, 'days', disabled, always)).toEqual(d(2026, 11, 14));
		expect(findEnabledDate(d(2026, 11, 13), -1, 'days', disabled, always)).toEqual(d(2026, 11, 10));
	});

	it('упирается в границу диапазона', () => {
		const inRange = (date: { day: number }) => date.day <= 12;
		expect(findEnabledDate(d(2026, 11, 11), 1, 'days', (date) => date.day >= 11, inRange)).toBeNull();
	});

	it('шагает ячейкой режима: месяц и год', () => {
		expect(findEnabledDate(d(2026, 3, 15), 1, 'months', (date) => date.month < 6, always)).toEqual(d(2026, 6, 15));
		expect(findEnabledDate(d(2026, 3, 15), -1, 'years', (date) => date.year > 2024, always)).toEqual(d(2024, 3, 15));
	});

	it('предикат, отключающий всё, даёт null за MAX_SKIP шагов', () => {
		let calls = 0;
		const disabled = () => {
			calls += 1;
			return true;
		};
		expect(findEnabledDate(d(2026, 1, 1), 1, 'days', disabled, always)).toBeNull();
		expect(calls).toBe(MAX_SKIP);
	});
});
