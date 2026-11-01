/** Страница нового размера, на которой остаётся первая запись прежней страницы. */
export function pageForSizeChange(page: number, oldSize: number, newSize: number): number {
	return Math.floor(((page - 1) * oldSize) / newSize) + 1;
}
