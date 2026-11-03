import type { PickerFieldProps } from '../../internal/picker-field/picker-field-props';

import type { TimePickerLabels } from './time-picker-labels';

export interface TimePickerProps
	extends Omit<
		PickerFieldProps,
		'text' | 'onTextChange' | 'onCommit' | 'onRevert' | 'icon' | 'openLabel' | 'panelLabel' | 'clearLabel' | 'onClear' | 'hiddenValue'
		| 'children' | 'panelClass' | 'mask'
	> {
	/** Выбранное время `HH:mm` (24 часа); `null` значит «не выбрано». */
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string | null) => void) | undefined;

	/** Границы включительно, `HH:mm`; `min` позже `max` игнорируются. */
	min?: string | undefined;
	max?: string | undefined;
	/** Получает `HH:mm`; должна быть дешёвой и чистой. */
	isTimeDisabled?: ((time: string) => boolean) | undefined;
	/** Шаг колонки минут, по умолчанию 1: ограничивает колонку и «Сейчас», но не ввод текста. */
	minuteStep?: 1 | 2 | 5 | 10 | 15 | 20 | 30 | undefined;

	/** Локаль формата текста; по умолчанию `ru`. */
	locale?: string | undefined;
	/** Двенадцатичасовой вид текста и панели; по умолчанию как у локали. */
	hour12?: boolean | undefined;
	/** Кнопка «Сейчас» в подвале панели (по умолчанию `true`). */
	showNow?: boolean | undefined;
	/** Маска ввода: только цифры и разделители, разделители ставятся сами; `false` оставляет поле свободным (по умолчанию `true`). */
	mask?: boolean | undefined;
	/** Подсказка в поле; по умолчанию «чч:мм» по образцу локали. */
	placeholder?: string | undefined;
	labels?: Partial<TimePickerLabels> | undefined;
}
