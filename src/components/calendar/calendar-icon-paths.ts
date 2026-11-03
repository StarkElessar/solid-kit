/** Геометрия значков шапки для `viewBox="0 0 16 16"`: штрих `currentColor`, ширина 1.6, скруглённые концы (как у значков пейджера). */
export const CALENDAR_ICON_PATHS = {
	previous: 'M10 3L5 8l5 5',
	next: 'M6 3l5 5-5 5'
} as const;

export type CalendarIconName = keyof typeof CALENDAR_ICON_PATHS;
