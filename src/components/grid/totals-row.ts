/** Строка итогов: `page` это итог страницы, `all` итог по всей выборке. */
export interface TotalsRow {
	kind: 'page' | 'all';
	label: string;
	values: Readonly<Record<string, unknown>>;
}
