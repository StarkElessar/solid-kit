/**
 * Сколько чипов помещается в `available` px (режим `collapse`). Если помещаются все, счётчик «+N» не нужен; иначе под него
 * резервируется `counterWidth` и промежуток `gap`, и берётся наибольшее число первых чипов, которое помещается рядом с ним.
 */
export function fitChips(widths: readonly number[], available: number, counterWidth: number, gap: number): number {
	let used = 0;
	for (const [index, width] of widths.entries()) {
		used += width + (index === 0 ? 0 : gap);
	}
	if (used <= available) {
		return widths.length;
	}
	let count = 0;
	used = counterWidth;
	for (const [index, width] of widths.entries()) {
		used += gap + width;
		if (used > available) {
			break;
		}
		count = index + 1;
	}
	return count;
}
