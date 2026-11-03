import type { GridLevelLabels } from './grid-level-labels';

export const DEFAULT_LEVEL_LABELS: GridLevelLabels = {
	collapseLevel: 'Свернуть уровень',
	collapseAll: 'Свернуть все',
	expandLevel: 'Развернуть уровень',
	expandAll: 'Развернуть все',
	expand: (title) => `Развернуть ${title}`,
	collapse: (title) => `Свернуть ${title}`,
	loadingRows: 'Загрузка…'
};
