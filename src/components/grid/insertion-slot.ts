/** Щель вставки по горизонтали указателя: сколько центров чипов левее `x`. */
export function insertionSlot(centers: readonly number[], x: number): number {
	return centers.filter((center) => center < x).length;
}
