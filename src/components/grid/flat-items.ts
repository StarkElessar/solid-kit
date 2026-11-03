import type { GridItem } from './grid-item';

/** Плоский список видимых элементов тела и листовые строки в порядке показа; общий для групп и дерева. */
export interface FlatItems<T> {
	items: readonly GridItem<T>[];
	rows: readonly T[];
}
