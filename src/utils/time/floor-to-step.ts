/** Ближайшая не большая минута, кратная шагу. */
export function floorToStep(minute: number, step: number): number {
	return minute - (minute % step);
}
