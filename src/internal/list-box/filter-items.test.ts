import { describe, expect, it, vi } from 'vitest';

import { filterItems } from './filter-items';

const names = ['Анна', 'Борис', 'Вера', 'Аркадий'];
const label = (name: string) => name;

describe('filterItems', () => {
	it('по умолчанию: подпись содержит запрос без учёта регистра', () => {
		expect(filterItems(names, 'АР', undefined, label)).toEqual(['Аркадий']);
		expect(filterItems(names, 'а', undefined, label)).toEqual(['Анна', 'Вера', 'Аркадий']);
	});

	it('пустой запрос возвращает тот же массив', () => {
		expect(filterItems(names, '', undefined, label)).toBe(names);
	});

	it('filter === false отключает клиентский фильтр (внешний поиск)', () => {
		expect(filterItems(names, 'zzz', false, label)).toBe(names);
	});

	it('свой фильтр получает элемент и запрос; пустой запрос его не вызывает', () => {
		const custom = vi.fn((name: string, query: string) => name.startsWith(query));
		expect(filterItems(names, 'А', custom, label)).toEqual(['Анна', 'Аркадий']);
		expect(custom).toHaveBeenCalledWith('Анна', 'А');
		custom.mockClear();
		expect(filterItems(names, '', custom, label)).toBe(names);
		expect(custom).not.toHaveBeenCalled();
	});

	it('ничего не найдено: пустой массив', () => {
		expect(filterItems(names, 'щ', undefined, label)).toEqual([]);
	});
});
