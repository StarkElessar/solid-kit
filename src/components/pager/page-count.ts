/** Число страниц: не меньше 1, мусорные `total` и `pageSize` дают одну страницу. */
export function pageCount(total: number, pageSize: number): number {
	if (!Number.isFinite(total) || !Number.isFinite(pageSize) || total <= 0 || pageSize < 1) {
		return 1;
	}
	return Math.max(1, Math.ceil(total / pageSize));
}
