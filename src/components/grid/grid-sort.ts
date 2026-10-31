/** Текущая сортировка грида: сортирует сервер, грид только показывает стрелку и сообщает о смене. */
export interface GridSort {
	columnId: string;
	direction: 'asc' | 'desc';
}
