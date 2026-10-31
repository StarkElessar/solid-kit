import type { RowKey } from './row-key';

export type SelectionState = 'none' | 'some' | 'all';

/** Переключает ключ; возвращает новый набор, вход не меняется. */
export function toggleKey(keys: ReadonlySet<RowKey>, key: RowKey): ReadonlySet<RowKey> {
	const next = new Set(keys);
	if (!next.delete(key)) {
		next.add(key);
	}
	return next;
}

/** Добавляет все загруженные ключи; ключи прошлых загрузок сохраняются. */
export function selectAllKeys(keys: ReadonlySet<RowKey>, loaded: readonly RowKey[]): ReadonlySet<RowKey> {
	const next = new Set(keys);
	for (const key of loaded) {
		next.add(key);
	}
	return next;
}

/** Убирает только загруженные ключи: выбор строк, которых нет в текущей загрузке, не теряется (раздел 7 спека). */
export function clearKeys(keys: ReadonlySet<RowKey>, loaded: readonly RowKey[]): ReadonlySet<RowKey> {
	const next = new Set(keys);
	for (const key of loaded) {
		next.delete(key);
	}
	return next;
}

/** Состояние главного чекбокса: считается только по загруженным ключам. */
export function selectionOf(keys: ReadonlySet<RowKey>, loaded: readonly RowKey[]): SelectionState {
	let selected = 0;
	for (const key of loaded) {
		if (keys.has(key)) {
			selected++;
		}
	}
	if (selected === 0) {
		return 'none';
	}
	return selected === loaded.length ? 'all' : 'some';
}
