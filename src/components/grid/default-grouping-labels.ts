import type { GridGroupingLabels } from './grid-grouping-labels';

export const DEFAULT_GROUPING_LABELS: GridGroupingLabels = {
	panel: 'Группировка',
	hint: 'Перетащите заголовок колонки сюда, чтобы сгруппировать',
	remove: (title) => `Убрать группировку по «${title}»`,
	collapseLevel: 'Свернуть уровень',
	collapseAll: 'Свернуть все',
	expandLevel: 'Развернуть уровень',
	expandAll: 'Развернуть все',
	expand: (title) => `Развернуть группу ${title}`,
	collapse: (title) => `Свернуть группу ${title}`,
	groupTotal: (title) => `Итого: ${title}`,
	emptyValue: '(пусто)',
	loadingRows: 'Загрузка…',
	group: 'Сгруппировать',
	ungroup: 'Убрать группировку'
};
