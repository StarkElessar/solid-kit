import type { DateParts } from '../date/date-parts';
import type { TimeParts } from '../time/time-parts';

/** Дата со временем суток без часового пояса (стенные часы). */
export interface DateTimeParts {
	readonly date: DateParts;
	readonly time: TimeParts;
}
