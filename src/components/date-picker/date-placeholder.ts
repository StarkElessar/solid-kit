import { datePattern } from '../../utils/date/date-pattern';

import type { DatePickerLabels } from './date-picker-labels';

/** Подсказка в поле по образцу локали: «дд.мм.гггг», «мм/дд/гггг». */
export function datePlaceholder(locale: string, labels: Pick<DatePickerLabels, 'day' | 'month' | 'year'>): string {
	const { order, separator } = datePattern(locale);
	return order.map((part) => labels[part]).join(separator);
}
