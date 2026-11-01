/** Тексты пейджера; по умолчанию на русском (`DEFAULT_PAGER_LABELS`). */
export interface PagerLabels {
	/** Имя области навигации. */
	navigation: string;
	first: string;
	previous: string;
	next: string;
	last: string;
	/** Подпись кнопки номера страницы. */
	page: (page: number) => string;
	/** Подпись выбора размера страницы. */
	pageSize: string;
	refresh: string;
}
