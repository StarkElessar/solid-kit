import type { GridItem } from '../grid/grid-item';
import type { RowKey } from '../grid/row-key';

import type { NodeLoadPlan } from './node-load-plan';

const NOTHING: NodeLoadPlan = { fresh: [], joined: [] };

/**
 * План догрузки по данным, а не по DOM: просматривается весь плоский список видимых узлов (до окна рендера), поэтому в план попадают
 * и узлы вне окна. Кандидат это элемент-заглушка: раскрытый видимый узел без детей. Уже запрошенные в этом раскрытии пропускаются;
 * узел, чей запрос идёт (`loadingKeys`), не запрашивается повторно, а присоединяется к нему.
 */
export function planNodeLoad<T>(
	items: readonly GridItem<T>[],
	requested: ReadonlySet<RowKey>,
	loadingKeys: ReadonlySet<RowKey>
): NodeLoadPlan {
	const fresh: RowKey[] = [];
	const joined: RowKey[] = [];
	for (const item of items) {
		if (item.kind !== 'loading' || requested.has(item.key)) {
			continue;
		}
		(loadingKeys.has(item.key) ? joined : fresh).push(item.key);
	}
	return fresh.length === 0 && joined.length === 0 ? NOTHING : { fresh, joined };
}
