import type { PagerLabels } from './pager-labels';

export const DEFAULT_PAGER_LABELS: PagerLabels = {
	navigation: 'Постраничная навигация',
	first: 'В начало',
	previous: 'Назад',
	next: 'Вперёд',
	last: 'В конец',
	page: (page) => `Страница ${page}`,
	pageSize: 'Размер страницы',
	refresh: 'Обновить'
};
