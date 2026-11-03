import { type Accessor, createContext, useContext } from 'solid-js';

import type { DateFormats } from '../../utils/date/create-date-formats';
import type { DateParts } from '../../utils/date/date-parts';

import type { CalendarLabels } from './calendar-labels';
import type { CalendarView } from './calendar-view';

export interface CalendarContextValue {
	formats: Accessor<DateFormats>;
	labels: Accessor<CalendarLabels>;
	view: Accessor<CalendarView>;
	/** Дата фокуса; её месяц показан в режиме дней. */
	focused: Accessor<DateParts>;
	selected: Accessor<DateParts | null>;
	today: Accessor<DateParts>;
	firstDay: Accessor<number>;
	disabled: Accessor<boolean>;
	showToday: Accessor<boolean>;
	isDateDisabled: (date: DateParts) => boolean;
	/** Есть ли в ячейке режима (день, месяц, год), в которую входит дата, хоть одна дата из `[min, max]`. */
	isInRange: (view: CalendarView, date: DateParts) => boolean;
	canDrill: Accessor<boolean>;
	/** Уход вглубь: дни → месяцы → годы. */
	drill: () => void;
	/** Возврат на уровень ниже по глубине без выбора: годы → месяцы → дни. */
	back: () => void;
	/** Выбор месяца или года в соответствующем режиме: показ переходит на уровень ниже, `value` не меняется. */
	pick: (date: DateParts) => void;
	canShift: (direction: -1 | 1) => boolean;
	shift: (direction: -1 | 1) => void;
	select: (date: DateParts) => void;
	goToToday: () => void;
}

export const CalendarContext = createContext<CalendarContextValue>();

export function useCalendarContext(): CalendarContextValue {
	const context = useContext(CalendarContext);
	if (!context) {
		throw new Error('[solid-kit] Calendar parts must be used inside <Calendar>.');
	}
	return context;
}
