/** Календарная дата без времени и часового пояса: год 1–9999, месяц 1–12, день 1–31. */
export interface DateParts {
	readonly year: number;
	readonly month: number;
	readonly day: number;
}
