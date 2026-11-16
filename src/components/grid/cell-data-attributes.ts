import type { GridCellAttributes } from './grid-cell-attributes';

/** Служебные атрибуты ячейки, которые ставит сам грид: потребитель их не перебивает. */
const RESERVED = new Set(['data-sticky', 'data-sticky-last', 'data-align', 'data-indent']);

/** `data-*` из атрибутов ячейки потребителя без служебных атрибутов грида; `class` и `style` сливаются отдельно. */
export function cellDataAttributes(attributes: GridCellAttributes): Record<string, string | undefined> {
	const result: Record<string, string | undefined> = {};
	for (const [name, value] of Object.entries(attributes)) {
		if (name.startsWith('data-') && !RESERVED.has(name)) {
			result[name] = value as string | undefined;
		}
	}
	return result;
}
