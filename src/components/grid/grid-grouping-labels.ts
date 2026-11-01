/** Тексты UI группировки; переопределяются через `groupingLabels` грида. */
export interface GridGroupingLabels {
	/** Имя панели группировки для читалок. */
	panel: string;
	/** Подсказка пустой панели. */
	hint: string;
	/** Подпись кнопки «×» чипа. */
	remove: (title: string) => string;
	collapseLevel: string;
	collapseAll: string;
	expandLevel: string;
	expandAll: string;
	/** Подпись шеврона свёрнутой группы. */
	expand: (title: string) => string;
	/** Подпись шеврона развёрнутой группы. */
	collapse: (title: string) => string;
	/** Подпись подвала группы. */
	groupTotal: (title: string) => string;
	/** Значение группы без текста. */
	emptyValue: string;
	/** Заглушка ещё не загруженных строк группы. */
	loadingRows: string;
	/** Пункт меню колонки. */
	group: string;
	/** Пункт меню колонки, уже стоящей в группировке. */
	ungroup: string;
}
