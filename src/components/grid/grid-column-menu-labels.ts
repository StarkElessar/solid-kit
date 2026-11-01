/** Тексты меню колонки; все переопределяются через `columnMenuLabels` грида. */
export interface GridColumnMenuLabels {
	/** Подпись кнопки меню в ячейке шапки: получает название колонки. */
	button: (title: string) => string;
	lock: string;
	unlock: string;
	/** Подпись группы переключателей видимости. */
	columns: string;
}
