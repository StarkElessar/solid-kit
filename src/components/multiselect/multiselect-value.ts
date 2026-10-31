import type { ListKey } from '../../internal/list-box/list-row';

/** Выбранные элементы в порядке выбора либо ключ `allKey` (выбрано «Все», полный набор потребитель запрашивает сам). */
export type MultiSelectValue<T> = readonly T[] | ListKey;

export interface ValueContext<T> {
	getKey: (item: T) => ListKey;
	allKey: ListKey | undefined;
}

/** Выбрано «Все»: значение равно `allKey`. Любой другой не-массив считается пустым выбором. */
export function isAllValue<T>(value: MultiSelectValue<T>, allKey: ListKey | undefined): boolean {
	return allKey !== undefined && !Array.isArray(value) && value === allKey;
}

/** Массив выбранных элементов; для «Все» и для не-массива пустой. */
export function valueItems<T>(value: MultiSelectValue<T>): readonly T[] {
	return Array.isArray(value) ? (value as readonly T[]) : [];
}

/** Число выбранных: в состоянии «Все» равно `total`. */
export function selectedCount<T>(value: MultiSelectValue<T>, allKey: ListKey | undefined, total: number): number {
	return isAllValue(value, allKey) ? total : valueItems(value).length;
}

/**
 * Переключает одну опцию. Снятие опции в состоянии «Все» выводит из него: значением становится массив всех `items`, кроме снятой.
 */
export function toggleItem<T>(value: MultiSelectValue<T>, item: T, items: readonly T[], context: ValueContext<T>): readonly T[] {
	const key = context.getKey(item);
	if (isAllValue(value, context.allKey)) {
		return items.filter((candidate) => context.getKey(candidate) !== key);
	}
	const current = valueItems(value);
	return current.some((candidate) => context.getKey(candidate) === key)
		? current.filter((candidate) => context.getKey(candidate) !== key)
		: [...current, item];
}

export interface ToggleAllOptions<T> extends ValueContext<T> {
	/** Все элементы корня (`items`). */
	items: readonly T[];
	/** Показанные элементы: результат поиска. */
	shown: readonly T[];
	/** Запрос не пуст: «Все» действует только на показанные элементы. */
	filtered: boolean;
	/** Сейчас у «Все» стоит отметка. */
	checked: boolean;
	isItemDisabled?: ((item: T) => boolean) | undefined;
}

/**
 * Клик по строке «Все». Без поиска: отметка стоит → `[]`, иначе `allKey`. С поиском: отметка стоит → показанные снимаются,
 * иначе показанные доступные добавляются в конец.
 */
export function toggleAll<T>(value: MultiSelectValue<T>, options: ToggleAllOptions<T>): MultiSelectValue<T> {
	const { getKey, allKey, items, shown, filtered, checked } = options;
	if (!filtered) {
		if (checked) {
			return [];
		}
		return allKey === undefined ? [...items] : allKey;
	}
	const shownKeys = new Set(shown.map((item) => getKey(item)));
	const base = isAllValue(value, allKey) ? items : valueItems(value);
	if (checked) {
		return base.filter((item) => !shownKeys.has(getKey(item)));
	}
	const present = new Set(base.map((item) => getKey(item)));
	const additions = shown.filter((item) => !present.has(getKey(item)) && options.isItemDisabled?.(item) !== true);
	return [...base, ...additions];
}

/** У «Все» стоит отметка: значение `allKey` или выбраны все показанные доступные элементы (список не пуст). */
export function isAllChecked<T>(
	value: MultiSelectValue<T>,
	shown: readonly T[],
	context: ValueContext<T>,
	isItemDisabled?: (item: T) => boolean
): boolean {
	if (isAllValue(value, context.allKey)) {
		return true;
	}
	const selected = new Set(valueItems(value).map((item) => context.getKey(item)));
	let any = false;
	for (const item of shown) {
		if (isItemDisabled?.(item) === true) {
			continue;
		}
		if (!selected.has(context.getKey(item))) {
			return false;
		}
		any = true;
	}
	return any;
}

/** Текст счётчика: «N из M», при `N > M` «N выбрано», при `N = 0` пустая строка. */
export function countText(selected: number, total: number): string {
	if (selected === 0) {
		return '';
	}
	return selected > total ? `${selected} выбрано` : `${selected} из ${total}`;
}
