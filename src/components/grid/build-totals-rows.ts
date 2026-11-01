import type { GridTotalsLabels } from './grid-totals-labels';
import type { TotalsRow } from './totals-row';

type Totals = Readonly<Record<string, unknown>> | undefined;

/** Строки итогов в порядке «страница, выборка»; строка есть, только если передан её источник, недостающее не подставляется. */
export function buildTotalsRows(pageTotals: Totals, totals: Totals, labels: GridTotalsLabels): readonly TotalsRow[] {
	const rows: TotalsRow[] = [];
	if (pageTotals !== undefined) {
		rows.push({ kind: 'page', label: labels.page, values: pageTotals });
	}
	if (totals !== undefined) {
		rows.push({ kind: 'all', label: labels.all, values: totals });
	}
	return rows;
}
