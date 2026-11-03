import type { RowKey } from './row-key';

/** Узел дерева в строке данных: ключ, раскрываемость, состояние и место среди соседей (для `aria-setsize`, `aria-posinset`). */
export interface GridNode {
	key: RowKey;
	/** Есть что раскрывать: у узла есть дети или страница сообщила, что они есть. */
	expandable: boolean;
	expanded: boolean;
	/** Сколько узлов на этом уровне под тем же родителем. */
	setSize: number;
	/** Позиция среди них, с 1. */
	posInSet: number;
}
