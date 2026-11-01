/** Список выбора размера: `sizes` плюс текущий размер (чтобы переданный страницей размер вне списка не пропадал), по возрастанию. */
export function mergePageSizes(sizes: readonly number[], current: number): number[] {
	return [...new Set([...sizes, current])].sort((first, second) => first - second);
}
