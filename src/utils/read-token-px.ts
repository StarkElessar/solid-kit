/** Первое значение токена из `tokens` в px (положительное число) из вычисленного стиля элемента, иначе `fallback`. */
export function readTokenPx(element: Element, tokens: readonly string[], fallback: number): number {
	const style = getComputedStyle(element);
	for (const token of tokens) {
		const value = Number.parseFloat(style.getPropertyValue(token));
		if (Number.isFinite(value) && value > 0) {
			return value;
		}
	}
	return fallback;
}
