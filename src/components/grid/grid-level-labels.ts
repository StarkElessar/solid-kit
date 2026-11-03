/** Тексты кнопок уровней и шеврона; общие для групп грида и узлов TreeList. */
export interface GridLevelLabels {
	collapseLevel: string;
	collapseAll: string;
	expandLevel: string;
	expandAll: string;
	/** Подпись шеврона свёрнутой строки (`title` это текст её ячейки). */
	expand: (title: string) => string;
	/** Подпись шеврона развёрнутой строки. */
	collapse: (title: string) => string;
	/** Заглушка ещё не загруженных дочерних строк. */
	loadingRows: string;
}
