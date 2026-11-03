import type { DateParts } from '../date/date-parts';
import type { TimeParts } from '../time/time-parts';

export interface ParsedDateTimeText {
	readonly date: DateParts;
	/** `null`, если набрана только дата. */
	readonly time: TimeParts | null;
}
