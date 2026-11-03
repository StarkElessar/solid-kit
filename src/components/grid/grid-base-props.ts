import type { GridProps } from './grid-props';
import type { GridTreeSource } from './grid-tree-source';

/** Пропсы движка: пропсы грида плюс внутренний источник дерева, который передаёт `TreeList` (у `Grid` его нет). */
export interface GridBaseProps<T> extends GridProps<T> {
	/** Дерево вместо `rows` и `groups`. */
	tree?: GridTreeSource<T> | undefined;
}
