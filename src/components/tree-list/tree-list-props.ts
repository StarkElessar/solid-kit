import type { GridLevelLabels } from '../grid/grid-level-labels';
import type { GridProps } from '../grid/grid-props';
import type { GroupingPropKey } from '../grid/grouping-prop-key';
import type { RowKey } from '../grid/row-key';

/** Пропсы TreeList: все пропсы Grid, кроме группировки, плюс дерево (спек TreeList, раздел 3). */
export interface TreeListProps<T> extends Omit<GridProps<T>, GroupingPropKey> {
	/** Плоский список узлов целиком; дерево строится по `getParentKey`. В ленивом режиме это загруженные узлы (корни и дети). */
	rows?: readonly T[] | undefined;
	/** Ключ родителя; `undefined` и `null` у корней. Родителя нет в списке: узел корневой. */
	getParentKey?: ((row: T) => RowKey | null | undefined) | undefined;
	/** Ленивый режим: дети узла догружаются при раскрытии. Страница синхронно кладёт ключ в `loadingKeys` и добавляет детей в `rows`. */
	loadChildren?: ((row: T) => void) | undefined;
	/** Есть ли у узла дети (нужен в ленивом режиме, в обычном дети видны из `rows`). */
	hasChildren?: ((row: T) => boolean) | undefined;
	expandedKeys?: ReadonlySet<RowKey> | undefined;
	defaultExpandedKeys?: ReadonlySet<RowKey> | undefined;
	onExpandedKeysChange?: ((keys: ReadonlySet<RowKey>) => void) | undefined;
	/** Узлы, дети которых сейчас догружаются: под узлом строка «Загрузка…». */
	loadingKeys?: ReadonlySet<RowKey> | undefined;
	levelLabels?: Partial<GridLevelLabels> | undefined;
}
