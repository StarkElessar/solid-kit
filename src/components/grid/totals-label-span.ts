import type { GridColumn } from './grid-column';
import { hasTotalsValue } from './has-totals-value';

/**
 * Сколько колонок занимает подпись строки итогов: первая плюс идущие за ней без значения в итогах. Подпись не заходит на колонки с другим
 * закреплением: закреплённая подпись, растянутая на открепляемые колонки, при прокрутке закрыла бы их итоги.
 */
export function totalsLabelSpan<T>(columns: readonly GridColumn<T>[], values: Readonly<Record<string, unknown>>): number {
	const first = columns[0];
	if (first === undefined) {
		return 1;
	}
	let span = 1;
	while (span < columns.length) {
		const next = columns[span];
		if (next === undefined || hasTotalsValue(next.id, values) || (next.locked === true) !== (first.locked === true)) {
			break;
		}
		span++;
	}
	return span;
}
