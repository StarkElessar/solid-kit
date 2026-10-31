const FALLBACK_HEIGHT = 32;
const TOKENS = ['--s-kit-control-height', '--s-kit-control-height-md'] as const;

/**
 * Оценка высоты строки списка: вычисленный `--s-kit-control-height` на элементе (размер контрола), иначе
 * `--s-kit-control-height-md`, иначе 32. Токены заданы в px. Читается один раз при открытии, а не на каждую строку.
 */
export function readControlHeight(element: Element): number {
	const style = getComputedStyle(element);
	for (const token of TOKENS) {
		const value = Number.parseFloat(style.getPropertyValue(token));
		if (Number.isFinite(value) && value > 0) {
			return value;
		}
	}
	return FALLBACK_HEIGHT;
}
