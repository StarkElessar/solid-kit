import { describe, expect, it } from 'vitest';

import type { GridItem } from '../grid/grid-item';
import type { RowKey } from '../grid/row-key';

import { planNodeLoad } from './plan-node-load';

const loading = (key: number): GridItem<unknown> => ({ kind: 'loading', key, level: 1 });
const row = (index: number): GridItem<unknown> => ({ kind: 'row', row: index, rowIndex: index, level: 0 });
const keys = (...values: number[]): ReadonlySet<RowKey> => new Set<RowKey>(values);

describe('planNodeLoad', () => {
	it('заглушки без запроса идут в одну пачку в порядке показа', () => {
		const plan = planNodeLoad([row(0), loading(3), row(1), loading(1), loading(2)], keys(), keys());
		expect(plan).toEqual({ fresh: [3, 1, 2], joined: [] });
	});

	it('запрошенные в этом раскрытии пропускаются', () => {
		expect(planNodeLoad([loading(1), loading(2)], keys(1), keys())).toEqual({ fresh: [2], joined: [] });
	});

	it('узел с идущим запросом присоединяется, а не запрашивается', () => {
		expect(planNodeLoad([loading(1), loading(2)], keys(), keys(2))).toEqual({ fresh: [1], joined: [2] });
	});

	it('запрошенный узел с идущим запросом не попадает никуда', () => {
		expect(planNodeLoad([loading(1)], keys(1), keys(1))).toEqual({ fresh: [], joined: [] });
	});

	it('без заглушек плана нет', () => {
		expect(planNodeLoad([row(0), row(1)], keys(), keys(1))).toEqual({ fresh: [], joined: [] });
	});
});
