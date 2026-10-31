/**
 * Текст ячейки по умолчанию. Объекты, массивы, функции и символы дают пустую строку: их показывает функция `cell` колонки,
 * а `[object Object]` в ячейке всегда ошибка.
 */
export function formatCellValue(value: unknown): string {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? '' : value.toISOString();
	}
	switch (typeof value) {
		case 'string':
		case 'number':
		case 'bigint':
		case 'boolean':
			return String(value);
		default:
			return '';
	}
}
