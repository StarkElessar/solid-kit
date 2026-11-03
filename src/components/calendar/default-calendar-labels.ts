import type { CalendarLabels } from './calendar-labels';
import type { CalendarView } from './calendar-view';

const PREVIOUS: Record<CalendarView, string> = {
	days: 'Предыдущий месяц',
	months: 'Предыдущий год',
	years: 'Предыдущие годы'
};

const NEXT: Record<CalendarView, string> = {
	days: 'Следующий месяц',
	months: 'Следующий год',
	years: 'Следующие годы'
};

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
	previous: (view) => PREVIOUS[view],
	next: (view) => NEXT[view],
	chooseMonth: 'Выбрать месяц',
	chooseYear: 'Выбрать год',
	today: 'Сегодня',
	calendar: 'Календарь'
};
