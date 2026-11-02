import type { GridGroup } from '@stark/solid-kit/grid';

export interface GroupSource<T> {
	/** Значение поля `field` у строки. */
	valueOf: (field: string, row: T) => unknown;
	/** Агрегаты группы по её строкам (считает «сервер», а не грид). */
	aggregate: (rows: readonly T[]) => Readonly<Record<string, unknown>>;
	compare: (first: unknown, second: unknown) => number;
}

export interface GroupOptions {
	/** Загружены ли строки группы с этим ключом (иначе `not-loaded`, если группа не меньше порога). */
	isLoaded: (key: string) => boolean;
	/** Порядок групп поля: `1` по возрастанию, `-1` по убыванию. */
	direction: (field: string) => 1 | -1;
	/** Группы с таким числом строк и больше отдаются без строк, пока их не догрузили. */
	lazyFrom: number;
}

/** Поддельный сервер группировки: делит строки по полям, считает `count` и агрегаты целых групп, большие группы отдаёт лениво. */
export function buildGroups<T>(
	rows: readonly T[],
	fields: readonly string[],
	source: GroupSource<T>,
	options: GroupOptions,
	parentKey = ''
): GridGroup<T>[] {
	const [field, ...rest] = fields;
	if (field === undefined) {
		return [];
	}
	const buckets = new Map<unknown, T[]>();
	for (const row of rows) {
		const value = source.valueOf(field, row);
		const bucket = buckets.get(value);
		if (bucket === undefined) {
			buckets.set(value, [row]);
		}
		else {
			bucket.push(row);
		}
	}
	return [...buckets.entries()]
		.sort(([first], [second]) => options.direction(field) * source.compare(first, second))
		.map(([value, items]): GridGroup<T> => {
			const key = `${parentKey}${parentKey === '' ? '' : '/'}${field}=${String(value)}`;
			const base = { key, field, value, count: items.length, aggregates: source.aggregate(items) };
			if (rest.length > 0) {
				return { ...base, children: { kind: 'groups', items: buildGroups(items, rest, source, options, key) } };
			}
			if (items.length >= options.lazyFrom && !options.isLoaded(key)) {
				return { ...base, children: { kind: 'not-loaded' } };
			}
			return { ...base, children: { kind: 'rows', items } };
		});
}
