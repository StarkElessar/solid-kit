import type { DateParts } from './date-parts';
import { fromUtcTime } from './from-utc-time';
import { toUtcTime } from './to-utc-time';
import { weekdayOf } from './weekday-of';

export interface MonthGridCell {
	readonly date: DateParts;
	/** `false` у дней предыдущего и следующего месяцев, которыми добиты первая и последняя недели. */
	readonly inMonth: boolean;
}

export const MONTH_GRID_SIZE = 42;

const DAY_MS = 86_400_000;

/**
 * Сетка месяца: всегда 42 даты подряд (6 недель по 7 дней), первая неделя начинается с `firstDayOfWeek` (0 воскресенье).
 * Считается без зажатия в 1–9999: клетки у границ диапазона могут выйти за него, их отключает вызывающий код.
 */
export function monthGrid(year: number, month: number, firstDayOfWeek: number): readonly MonthGridCell[] {
	const first = { year, month, day: 1 };
	const offset = (weekdayOf(first) - firstDayOfWeek + 7) % 7;
	const start = toUtcTime(first) - offset * DAY_MS;
	return Array.from({ length: MONTH_GRID_SIZE }, (_, index) => {
		const date = fromUtcTime(start + index * DAY_MS);
		return { date, inMonth: date.year === year && date.month === month };
	});
}
