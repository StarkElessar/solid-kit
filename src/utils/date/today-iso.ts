import { formatIsoDate } from './format-iso-date';

/** Сегодняшняя дата по часам устройства (локальное время, единственное место в хелперах дат). */
export function todayIso(): string {
	const now = new Date();
	return formatIsoDate({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() });
}
