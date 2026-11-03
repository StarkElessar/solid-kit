import { describe, expect, it } from 'vitest';

import { formatIsoDate } from './format-iso-date';
import { MONTH_GRID_SIZE, monthGrid } from './month-grid';
import { toUtcTime } from './to-utc-time';

function isoOf(cells: ReturnType<typeof monthGrid>, index: number): string {
	const cell = cells[index];
	return cell ? formatIsoDate(cell.date) : 'нет клетки';
}

describe('monthGrid', () => {
	it('всегда 42 подряд идущие даты', () => {
		for (const [year, month] of [[2026, 11], [2027, 2], [2026, 2], [2026, 5], [2024, 2], [2026, 8]] as const) {
			for (const firstDay of [0, 1, 6]) {
				const cells = monthGrid(year, month, firstDay);
				const times = cells.map((cell) => toUtcTime(cell.date));
				expect(cells).toHaveLength(MONTH_GRID_SIZE);
				const steps = times.slice(1).map((time, index) => time - (times[index] ?? 0));
				expect(steps).toEqual(Array.from({ length: 41 }, () => 86_400_000));
			}
		}
	});

	it('ноябрь 2026 с понедельника: начало 26 октября, месяц в клетках 6–35', () => {
		const cells = monthGrid(2026, 11, 1);
		expect(isoOf(cells, 0)).toBe('2026-10-26');
		expect(isoOf(cells, 6)).toBe('2026-11-01');
		expect(isoOf(cells, 35)).toBe('2026-11-30');
		expect(isoOf(cells, 41)).toBe('2026-12-06');
		expect(cells.map((cell) => cell.inMonth)).toEqual(
			Array.from({ length: 42 }, (_, index) => index >= 6 && index <= 35)
		);
	});

	it('февраль 2027 (28 дней, начинается с понедельника): первая неделя целиком в месяце, последние две чужие', () => {
		const cells = monthGrid(2027, 2, 1);
		expect(isoOf(cells, 0)).toBe('2027-02-01');
		expect(cells.slice(0, 28).every((cell) => cell.inMonth)).toBe(true);
		expect(cells.slice(28).every((cell) => !cell.inMonth)).toBe(true);
	});

	it('месяц из 31 дня, начинающийся в воскресенье, занимает 6 недель при старте с понедельника', () => {
		const cells = monthGrid(2026, 3, 1);
		expect(isoOf(cells, 0)).toBe('2026-02-23');
		expect(isoOf(cells, 6)).toBe('2026-03-01');
		expect(cells[36]?.inMonth).toBe(true);
		expect(isoOf(cells, 36)).toBe('2026-03-31');
	});

	it('старт с воскресенья сдвигает начало', () => {
		const cells = monthGrid(2026, 11, 0);
		expect(isoOf(cells, 0)).toBe('2026-11-01');
		expect(cells[0]?.inMonth).toBe(true);
	});

	it('число клеток месяца равно его длине', () => {
		expect(monthGrid(2024, 2, 1).filter((cell) => cell.inMonth)).toHaveLength(29);
		expect(monthGrid(2026, 4, 0).filter((cell) => cell.inMonth)).toHaveLength(30);
	});
});
