import type { PickerFieldProps } from '../../internal/picker-field/picker-field-props';
import type { CalendarLabels } from '../calendar';

import type { DatePickerLabels } from './date-picker-labels';

export interface DatePickerProps
	extends Omit<
		PickerFieldProps,
		'text' | 'onTextChange' | 'onCommit' | 'onRevert' | 'icon' | 'openLabel' | 'panelLabel' | 'clearLabel' | 'onClear' | 'hiddenValue'
		| 'children' | 'panelClass'
	> {
	/** Выбранная дата `YYYY-MM-DD`; `null` значит «не выбрана». */
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string | null) => void) | undefined;

	/** Границы включительно, `YYYY-MM-DD`. */
	min?: string | undefined;
	max?: string | undefined;
	isDateDisabled?: ((date: string) => boolean) | undefined;

	/** Локаль формата текста, названий и первого дня недели; по умолчанию `ru`. */
	locale?: string | undefined;
	firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
	/** «Сегодня» в календаре выбирает дату (по умолчанию `true`). */
	selectOnToday?: boolean | undefined;
	/** Подсказка в поле; по умолчанию «дд.мм.гггг» по образцу локали. */
	placeholder?: string | undefined;
	labels?: Partial<DatePickerLabels> | undefined;
	calendarLabels?: Partial<CalendarLabels> | undefined;
}
