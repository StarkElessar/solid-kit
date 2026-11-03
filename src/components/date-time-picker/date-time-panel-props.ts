import type { DateParts } from '../../utils/date/date-parts';
import type { DateTimeParts } from '../../utils/date-time/date-time-parts';
import type { TimeParts } from '../../utils/time/time-parts';
import type { CalendarLabels } from '../calendar';

import type { DateTimePickerLabels } from './date-time-picker-labels';

export interface DateTimePanelProps {
	value: DateTimeParts | null;

	/** Показанная в календаре дата `YYYY-MM-DD`. */
	focusedDate: string;
	onFocusedDateChange: (date: string) => void;
	onDateSelect: (date: DateParts) => void;
	/** Границы календаря по датам, `YYYY-MM-DD`. */
	minDate?: string | undefined;
	maxDate?: string | undefined;
	isDateDisabled?: ((date: string) => boolean) | undefined;
	locale: string;
	firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined;
	calendarLabels?: Partial<CalendarLabels> | undefined;

	/** Набранное, но ещё не принятое время. */
	highlightedTime: TimeParts | null;
	onTimeSelect: (time: TimeParts) => void;
	/** Выбор минут (периода): панель можно закрывать. */
	onFinish: () => void;
	/** Границы времени для даты, к которой относится выбор. */
	minTime?: TimeParts | undefined;
	maxTime?: TimeParts | undefined;
	isTimeDisabled?: ((time: string) => boolean) | undefined;
	minuteStep: number;
	hour12: boolean;
	periodNames: readonly [string, string];

	showNow: boolean;
	nowAllowed: boolean;
	onNow: () => void;

	labels: DateTimePickerLabels;
	size?: 'sm' | 'md' | 'lg' | undefined;
}
