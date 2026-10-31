import type { ListRow } from './list-row';

/**
 * Индекс первой доступной опции, чья подпись начинается с накопленной строки `buffer` (регистр не учитывается), или -1.
 * Поиск идёт от `current` включительно и по кругу. Буфер из одной повторяющейся буквы («аа») ищет следующую опцию
 * на эту букву после `current`. «Все» и заголовки не участвуют. Накопление и сброс буфера делает вызывающий.
 */
export function matchTypeahead<T>(rows: readonly ListRow<T>[], current: number, buffer: string): number {
	if (buffer === '') {
		return -1;
	}
	const chars = Array.from(buffer.toLocaleLowerCase());
	const firstChar = chars[0] ?? '';
	const repeated = chars.length > 1 && chars.every((char) => char === firstChar);
	const prefix = repeated ? firstChar : chars.join('');
	const count = rows.length;
	const hasCurrent = current >= 0 && current < count;
	const start = hasCurrent ? current + (repeated ? 1 : 0) : 0;

	for (let offset = 0; offset < count; offset++) {
		const index = (start + offset) % count;
		const row = rows[index];
		if (row?.kind === 'option' && !row.disabled && row.label.toLocaleLowerCase().startsWith(prefix)) {
			return index;
		}
	}
	return -1;
}
