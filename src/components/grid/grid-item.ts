import type { GridGroup } from './grid-group';
import type { GridNode } from './grid-node';
import type { RowKey } from './row-key';

/**
 * Элемент плоского списка тела: строка данных (`rowIndex` это индекс среди листовых строк; `node` есть у строк дерева), заголовок
 * группы, подвал группы или заглушка ещё не загруженных строк.
 */
export type GridItem<T> =
	| { kind: 'row'; row: T; rowIndex: number; level: number; node?: GridNode | undefined }
	| { kind: 'group'; group: GridGroup<T>; level: number; expanded: boolean }
	| { kind: 'footer'; group: GridGroup<T>; level: number }
	| { kind: 'loading'; key: RowKey; level: number };
