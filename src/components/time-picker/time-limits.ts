import type { TimeParts } from '../../utils/time/time-parts';

/** Что ограничивает допустимые времена панели. */
export interface TimeLimits {
	readonly min?: TimeParts | undefined;
	readonly max?: TimeParts | undefined;
	readonly isDisabled?: ((time: string) => boolean) | undefined;
	readonly step: number;
}
