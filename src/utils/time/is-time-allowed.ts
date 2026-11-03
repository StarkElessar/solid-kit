import { compareTimes } from './compare-times';
import { formatIsoTime } from './format-iso-time';
import type { TimeParts } from './time-parts';

/** Время допустимо, если оно внутри `min`…`max` (включительно) и не отключено предикатом (он получает `HH:mm`). */
export function isTimeAllowed(
	time: TimeParts,
	min?: TimeParts,
	max?: TimeParts,
	isDisabled?: ((time: string) => boolean)
): boolean {
	if ((min && compareTimes(time, min) < 0) || (max && compareTimes(time, max) > 0)) {
		return false;
	}
	return isDisabled?.(formatIsoTime(time)) !== true;
}
