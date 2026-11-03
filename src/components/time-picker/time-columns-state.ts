import { isTimeAllowed } from '../../utils/time/is-time-allowed';
import { minuteOptions } from '../../utils/time/minute-options';
import type { TimeParts } from '../../utils/time/time-parts';

import type { TimeLimits } from './time-limits';
import type { TimeRow } from './time-row';

/** На сколько строк сдвигают PageUp и PageDown. */
export const TIME_PAGE_SIZE = 6;

function pad(value: number): string {
	return String(value).padStart(2, '0');
}

/** Часы: 00…23, а в 12-часовом виде 12, 01…11 (`id` это час на циферблате, 12 имеет `id` 0). */
export function hourRows(hour12: boolean): TimeRow[] {
	const count = hour12 ? 12 : 24;
	return Array.from({ length: count }, (_, id) => ({ id, label: hour12 && id === 0 ? '12' : pad(id) }));
}

export function minuteRows(step: number): TimeRow[] {
	return minuteOptions(step).map((minute) => ({ id: minute, label: pad(minute) }));
}

/** Час 0–23 по строке часов; в 12-часовом виде добавляет 12 для периода PM. */
export function hour24Of(rowId: number, hour12: boolean, period: 0 | 1): number {
	return hour12 ? rowId + 12 * period : rowId;
}

/**
 * Время для выбранного часа. Минуты остаются прежними, если время допустимо; иначе берётся первая допустимая минута
 * колонки в этом часе; `null`, если в часе нет допустимых минут.
 */
export function resolveHour(hour: number, minute: number, limits: TimeLimits): TimeParts | null {
	const keep = { hour, minute };
	if (isTimeAllowed(keep, limits.min, limits.max, limits.isDisabled)) {
		return keep;
	}
	for (const option of minuteOptions(limits.step)) {
		const candidate = { hour, minute: option };
		if (isTimeAllowed(candidate, limits.min, limits.max, limits.isDisabled)) {
			return candidate;
		}
	}
	return null;
}

/** Та же строка, если она допустима, иначе ближайшая допустимая (при равенстве расстояний следующая); если таких нет, та же. */
export function nearestAllowedId(rows: readonly TimeRow[], id: number, isAllowed: (id: number) => boolean): number {
	const index = rows.findIndex((row) => row.id === id);
	if (index === -1 || isAllowed(id)) {
		return id;
	}
	for (let distance = 1; distance < rows.length; distance += 1) {
		for (const candidate of [rows[index + distance], rows[index - distance]]) {
			if (candidate && isAllowed(candidate.id)) {
				return candidate.id;
			}
		}
	}
	return id;
}

/**
 * Куда уходит фокус в колонке по клавише. Отключённые строки пропускаются, по кругу не ходим. `null`, если двигаться некуда
 * или клавиша не клавиша перемещения по колонке.
 */
export function moveRow(
	rows: readonly TimeRow[],
	currentId: number,
	key: string,
	isAllowed: (id: number) => boolean
): number | null {
	const current = rows.findIndex((row) => row.id === currentId);
	const allowed = rows.flatMap((row, index) => (isAllowed(row.id) ? [index] : []));
	const before = allowed.filter((index) => index < current);
	const after = allowed.filter((index) => index > current);
	let target: number | undefined;
	switch (key) {
		case 'ArrowUp':
			target = before.at(-1);
			break;
		case 'ArrowDown':
			target = after[0];
			break;
		case 'Home':
			target = before[0];
			break;
		case 'End':
			target = after.at(-1);
			break;
		case 'PageUp':
			target = before.findLast((index) => index <= current - TIME_PAGE_SIZE) ?? before[0];
			break;
		case 'PageDown':
			target = after.find((index) => index >= current + TIME_PAGE_SIZE) ?? after.at(-1);
			break;
		default:
			return null;
	}
	return target === undefined ? null : (rows[target]?.id ?? null);
}
