import type { GridGroup } from './grid-group';

/**
 * Элемент плоского списка тела: строка данных (`rowIndex` это индекс среди листовых строк), заголовок группы, подвал группы или
 * заглушка ещё не загруженных строк.
 */
export type GridItem<T> =
	| { kind: 'row'; row: T; rowIndex: number; level: number }
	| { kind: 'group'; group: GridGroup<T>; level: number; expanded: boolean }
	| { kind: 'footer'; group: GridGroup<T>; level: number }
	| { kind: 'loading'; key: string; level: number };
