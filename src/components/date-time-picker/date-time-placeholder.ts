import { datePattern } from '../../utils/date/date-pattern';
import { timePattern } from '../../utils/time/time-pattern';

import type { DateTimePickerLabels } from './date-time-picker-labels';

type PlaceholderLabels = Pick<DateTimePickerLabels, 'day' | 'month' | 'year' | 'hourPart' | 'minutePart' | 'period'>;

/** Подсказка в поле по образцу локали: «дд.мм.гггг чч:мм», в 12-часовом виде «мм/дд/гггг чч:мм AM/PM» (период по порядку локали). */
export function dateTimePlaceholder(locale: string, hour12: boolean | undefined, labels: PlaceholderLabels): string {
	const { order, separator } = datePattern(locale);
	const date = order.map((part) => labels[part]).join(separator);
	const pattern = timePattern(locale, hour12);
	const time = `${labels.hourPart}${pattern.separator}${labels.minutePart}`;
	if (!pattern.hour12) {
		return `${date} ${time}`;
	}
	return pattern.periodFirst
		? `${date} ${labels.period}${pattern.periodGap}${time}`
		: `${date} ${time}${pattern.periodGap}${labels.period}`;
}
