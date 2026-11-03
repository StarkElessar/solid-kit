import { formatIsoDate } from '../date/format-iso-date';
import { formatIsoTime } from '../time/format-iso-time';

import type { DateTimeParts } from './date-time-parts';

/** `YYYY-MM-DDTHH:mm`. */
export function formatIsoDateTime(value: DateTimeParts): string {
	return `${formatIsoDate(value.date)}T${formatIsoTime(value.time)}`;
}
