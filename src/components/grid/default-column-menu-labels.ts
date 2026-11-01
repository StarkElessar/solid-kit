import type { GridColumnMenuLabels } from './grid-column-menu-labels';

export const DEFAULT_COLUMN_MENU_LABELS: GridColumnMenuLabels = {
	button: (title) => `Меню колонки «${title}»`,
	lock: 'Закрепить',
	unlock: 'Открепить',
	columns: 'Колонки'
};
