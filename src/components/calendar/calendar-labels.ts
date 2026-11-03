import type { CalendarView } from './calendar-view';

export interface CalendarLabels {
	/** Имя кнопки «назад» в шапке для текущего режима. */
	previous: (view: CalendarView) => string;
	next: (view: CalendarView) => string;
	chooseMonth: string;
	chooseYear: string;
	today: string;
	/** Имя группы для читалок. */
	calendar: string;
}
