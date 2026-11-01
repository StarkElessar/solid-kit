import type { PagerRange } from './pager-range';

const NUMBER = new Intl.NumberFormat('ru');

/** «Записей 21–40 из 1 250»; при пустой выборке «Записей 0». */
export function defaultSummaryText(range: PagerRange): string {
	if (range.total === 0) {
		return 'Записей 0';
	}
	return `Записей ${NUMBER.format(range.from)}–${NUMBER.format(range.to)} из ${NUMBER.format(range.total)}`;
}
