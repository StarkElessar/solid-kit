import type { DateTimeParts } from './date-time-parts';

/** Что ограничивает допустимые значения: границы по дате и времени, предикаты и шаг минут для подбора ближайшего времени. */
export interface DateTimeRules {
	readonly min?: DateTimeParts | undefined;
	readonly max?: DateTimeParts | undefined;
	readonly isDateDisabled?: ((date: string) => boolean) | undefined;
	readonly isTimeDisabled?: ((time: string) => boolean) | undefined;
	readonly step: number;
}
