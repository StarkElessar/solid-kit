/** Группа от сервера: целиком относится ко всему результату запроса (счётчик и агрегаты не пересчитываются по загруженным строкам). */
export interface GridGroup<T> {
	/** Стабильный между загрузками путь группы, например `status=open/owner=7`. */
	key: string;
	/** Id колонки, по которой сгруппировано. */
	field: string;
	/** Значение группы для заголовка. */
	value: unknown;
	/** Строк в группе во всём результате. */
	count: number;
	/** Агрегаты по id колонки, от сервера. */
	aggregates?: Readonly<Record<string, unknown>> | undefined;
	children:
		| { kind: 'groups'; items: readonly GridGroup<T>[] }
		| { kind: 'rows'; items: readonly T[] }
		/** Строки ещё не загружены: раскрытие вызывает `onGroupExpand(key)`. */
		| { kind: 'not-loaded' };
}
