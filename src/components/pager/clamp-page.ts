/** Целая страница в `[1, count]`; нечисло даёт 1. */
export function clampPage(page: number, count: number): number {
	if (!Number.isFinite(page)) {
		return 1;
	}
	return Math.min(Math.max(Math.trunc(page), 1), Math.max(1, count));
}
