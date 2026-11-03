import type { TimeParts } from '../time/time-parts';

/** Границы времени для одной даты; отсутствующая граница значит «не ограничено». */
export interface TimeBounds {
	readonly min?: TimeParts;
	readonly max?: TimeParts;
}
