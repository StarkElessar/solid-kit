import type { PickerFieldProps } from '../../internal/picker-field/picker-field-props';
import type { CalendarLabels } from '../calendar';

import type { DateTimePickerLabels } from './date-time-picker-labels';

export interface DateTimePickerProps
	extends Omit<
		PickerFieldProps,
		'text' | 'onTextChange' | 'onCommit' | 'onRevert' | 'icon' | 'openLabel' | 'panelLabel' | 'clearLabel' | 'onClear' | 'hiddenValue'
		| 'children' | 'panelClass' | 'panelTab' | 'mask'
	> {
	/** Выбранные дата и время `YYYY-MM-DDTHH:mm` (без часового пояса); `null` значит «не выбрано». */
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string | null) => void) | undefined;

	/** Границы включительно, `YYYY-MM-DDTHH:mm`; время ограничивается только в день границы; `min` позже `max` игнорируются. */
	min?: string | undefined;
	max?: string | undefined;
	/** Получает `YYYY-MM-DD`. */
	isDateDisabled?: ((date: string) => boolean) | undefined;
	/** Получает `HH:mm`, действует в любой день; должна быть дешёвой и чистой. */
	isTimeDisabled?: ((time: string) => boolean) | undefined;
	/** Шаг колонки минут, по умолчанию 1: ограничивает колонку и «Сейчас», но не ввод текста. */
	minuteStep?: 1 | 2 | 5 | 10 | 15 | 20 | 30 | undefined;

	/** Локаль формата текста, названий и первого дня недели; по умолчанию `ru`. */
	locale?: string | undefined;
	/** Двенадцатичасовой вид текста и панели; по умолчанию как у локали. */
	hour12?: boolean | undefined;
	firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
	/** Кнопка «Сейчас» в подвале панели (по умолчанию `true`). */
	showNow?: boolean | undefined;
	/** Маска ввода: только цифры и разделители, разделители ставятся сами; `false` оставляет поле свободным (по умолчанию `true`). */
	mask?: boolean | undefined;
	/** Подсказка в поле; по умолчанию «дд.мм.гггг чч:мм» по образцу локали. */
	placeholder?: string | undefined;
	labels?: Partial<DateTimePickerLabels> | undefined;
	calendarLabels?: Partial<CalendarLabels> | undefined;
}
