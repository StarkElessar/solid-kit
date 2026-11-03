import type { RowKey } from '../grid/row-key';

/** Что делать с узлами, которым нужны дети: запросить пачкой или присоединиться к уже идущему запросу. */
export interface NodeLoadPlan {
	/** Узлы, детей которых ещё никто не запрашивал: уходят в один вызов `loadChildren`, в порядке показа. */
	readonly fresh: readonly RowKey[];
	/** Узлы, чей запрос уже идёт (ключ в `loadingKeys`), но в этом раскрытии он не учтён: вызова нет, ключ только помечается. */
	readonly joined: readonly RowKey[];
}
