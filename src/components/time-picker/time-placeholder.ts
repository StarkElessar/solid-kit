import { timePattern } from '../../utils/time/time-pattern';

import type { TimePickerLabels } from './time-picker-labels';

/** Подсказка в поле по образцу локали: «чч:мм», в 12-часовом виде «чч:мм AM/PM» (период по порядку локали). */
export function timePlaceholder(
	locale: string,
	hour12: boolean | undefined,
	labels: Pick<TimePickerLabels, 'hourPart' | 'minutePart' | 'period'>
): string {
	const pattern = timePattern(locale, hour12);
	const time = `${labels.hourPart}${pattern.separator}${labels.minutePart}`;
	if (!pattern.hour12) {
		return time;
	}
	return pattern.periodFirst ? `${labels.period}${pattern.periodGap}${time}` : `${time}${pattern.periodGap}${labels.period}`;
}
