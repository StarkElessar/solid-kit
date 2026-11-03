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
	/**
	 * Ленивый режим: дети узлов догружаются при раскрытии. Один вызов на весь набор видимых раскрытых узлов без детей (клик по шеврону
	 * даёт одну строку, «развернуть уровень» все узлы уровня), порядок как на экране; повторно узел в этом раскрытии не запрашивается.
	 * Страница синхронно кладёт ВСЕ ключи (`getRowKey`) в `loadingKeys` и держит их до последнего ответа, даже если режет запрос на
	 * куски; ответом добавляет в `rows` полный набор непосредственных детей каждого успешного родителя (у детей `getParentKey` равен
	 * `getRowKey` родителя, иначе они станут корнями) и снимает ключи. Пустой ответ и ошибка автоповтора не дают: узел запросится
	 * заново после сворачивания. Обработка ошибок и устаревших ответов на странице. «Развернуть все» в этом режиме отключена.
	 */
	loadChildren?: ((rows: readonly T[]) => void) | undefined;
	/** Есть ли у узла дети (нужен в ленивом режиме, в обычном дети видны из `rows`). */
	hasChildren?: ((row: T) => boolean) | undefined;
	expandedKeys?: ReadonlySet<RowKey> | undefined;
	defaultExpandedKeys?: ReadonlySet<RowKey> | undefined;
	onExpandedKeysChange?: ((keys: ReadonlySet<RowKey>) => void) | undefined;
	/** Узлы, дети которых сейчас догружаются: под узлом строка «Загрузка…». */
	loadingKeys?: ReadonlySet<RowKey> | undefined;
	levelLabels?: Partial<GridLevelLabels> | undefined;
}
