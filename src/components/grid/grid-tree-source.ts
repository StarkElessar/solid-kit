import type { Accessor } from 'solid-js';

import type { FlatItems } from './flat-items';
import type { GridLevelLabels } from './grid-level-labels';
import type { RowKey } from './row-key';

/** Источник дерева для движка: плоский список видимых узлов и действия раскрытия. Строит и держит его оболочка `TreeList`. */
export interface GridTreeSource<T> {
	flat: Accessor<FlatItems<T>>;
	/** Есть узлы: кнопки уровней доступны. */
	hasNodes: Accessor<boolean>;
	toggleNode: (key: RowKey) => void;
	/** Строка «Загрузка…» смонтирована: страница догружает детей узла. */
	loadNode: (key: RowKey) => void;
	collapseLevel: () => void;
	collapseAll: () => void;
	expandLevel: () => void;
	expandAll: () => void;
	levelLabels: Accessor<GridLevelLabels>;
}
