export type ListKey = string | number;

export interface ListOptionRow<T> {
	readonly kind: 'option';
	readonly key: ListKey;
	readonly item: T;
	readonly label: string;
	readonly disabled: boolean;
	/** Номер среди опций (заголовки и «Все» не считаются): основа `aria-posinset`. */
	readonly optionIndex: number;
	/** Номер группы, `-1` без `groupBy`. */
	readonly groupIndex: number;
}

export interface ListGroupRow {
	readonly kind: 'group';
	readonly key: string;
	readonly label: string;
	readonly groupIndex: number;
}

/** Строка «Все» MultiSelect: активируется как опция, в `optionIndex` не входит; подпись рисует разметка (`allLabel`). */
export interface ListAllRow {
	readonly kind: 'all';
	readonly key: ListKey;
}

export type ListRow<T> = ListOptionRow<T> | ListGroupRow | ListAllRow;
