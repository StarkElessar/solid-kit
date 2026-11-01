/** Состояние жеста перетаскивания в панель группировки. */
export interface GroupingDragState {
	columnId: string;
	/** Название колонки для «призрака». */
	title: string;
	/** Координаты указателя во viewport. */
	x: number;
	y: number;
	/** Указатель над панелью группировки. */
	overPanel: boolean;
	/** Щель вставки среди чипов (0 перед первым, число чипов после последнего). */
	slot: number;
}
