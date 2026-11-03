import { DEFAULT_LEVEL_LABELS } from './default-level-labels';
import type { GridGroupingLabels } from './grid-grouping-labels';

export const DEFAULT_GROUPING_LABELS: GridGroupingLabels = {
	...DEFAULT_LEVEL_LABELS,
	panel: 'Группировка',
	hint: 'Перетащите заголовок колонки сюда, чтобы сгруппировать',
	remove: (title) => `Убрать группировку по «${title}»`,
	expand: (title) => `Развернуть группу ${title}`,
	collapse: (title) => `Свернуть группу ${title}`,
	groupSort: (title, direction) => `Порядок групп «${title}»: ${direction === 'asc' ? 'по возрастанию' : 'по убыванию'}`,
	groupCount: (count) => `Всего: ${count}`,
	emptyValue: '(пусто)',
	group: 'Сгруппировать',
	ungroup: 'Убрать группировку'
};
