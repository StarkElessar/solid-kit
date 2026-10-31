import type { ListRow } from './list-row';

/**
 * Только для тестов. `'#Имя'` заголовок группы, `'!Имя'` отключённая опция, `'=Имя'` строка «Все», иначе обычная опция;
 * ключ равен подписи.
 */
export function buildRows(spec: readonly string[]): ListRow<string>[] {
	const rows: ListRow<string>[] = [];
	let optionIndex = 0;
	let groupIndex = -1;
	for (const entry of spec) {
		const marker = entry.slice(0, 1);
		if (marker === '#') {
			groupIndex++;
			rows.push({ kind: 'group', key: entry.slice(1), label: entry.slice(1), groupIndex });
		}
		else if (marker === '=') {
			rows.push({ kind: 'all', key: entry.slice(1) });
		}
		else {
			const disabled = marker === '!';
			const name = disabled ? entry.slice(1) : entry;
			rows.push({ kind: 'option', key: name, item: name, label: name, disabled, optionIndex: optionIndex++, groupIndex });
		}
	}
	return rows;
}
