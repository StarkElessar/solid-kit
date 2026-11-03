import type { JSX } from 'solid-js';

import type { CalendarLabels } from './calendar-labels';
import type { CalendarView } from './calendar-view';

export type CalendarSize = 'sm' | 'md' | 'lg';

export interface CalendarProps {
	/** Выбранная дата `YYYY-MM-DD`; `null` значит «не выбрана». */
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string | null) => void) | undefined;

	/** Дата, вокруг которой показан период и на которой стоит клавиатурный фокус. */
	focusedDate?: string | undefined;
	/** По умолчанию выбранная дата, иначе сегодня, зажатое в `[min, max]`. */
	defaultFocusedDate?: string | undefined;
	onFocusedDateChange?: ((date: string) => void) | undefined;

	/** Границы включительно, `YYYY-MM-DD`. */
	min?: string | undefined;
	max?: string | undefined;
	isDateDisabled?: ((date: string) => boolean) | undefined;
	disabled?: boolean | undefined;

	/** Локаль названий и первого дня недели; по умолчанию `ru`. */
	locale?: string | undefined;
	/** 0 воскресенье … 6 суббота; по умолчанию по локали. */
	firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
	/** Режим при монтировании; по умолчанию дни. Сам режим внутреннее состояние: DatePicker монтирует календарь заново при открытии. */
	defaultView?: CalendarView | undefined;
	/** Подвал с кнопкой «Сегодня»; по умолчанию `true`. */
	showToday?: boolean | undefined;
	/** «Сегодня» извне (тесты, серверное время); по умолчанию локальная дата устройства. */
	today?: string | undefined;
	/** При монтировании переносит фокус на сфокусированную дату (для DatePicker). */
	autoFocus?: boolean | undefined;
	size?: CalendarSize | undefined;
	labels?: Partial<CalendarLabels> | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
