/** Геометрия значков пейджера для `viewBox="0 0 16 16"`: штрих `currentColor`, ширина 1.6, скруглённые концы (как у стрелки сортировки). */
export const PAGER_ICON_PATHS = {
	first: 'M4 3v10M12 3L7 8l5 5',
	previous: 'M10 3L5 8l5 5',
	next: 'M6 3l5 5-5 5',
	last: 'M12 3v10M4 3l5 5-5 5',
	refresh: 'M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3'
} as const;

export type PagerIconName = keyof typeof PAGER_ICON_PATHS;
