import { describe, expect, it, vi } from 'vitest';

import { flattenRows } from './flatten-rows';

interface User {
	id: number;
	name: string;
	team: string;
	blocked?: boolean;
}

const users: User[] = [
	{ id: 1, name: 'Анна', team: 'Дизайн' },
	{ id: 2, name: 'Борис', team: 'Разработка' },
	{ id: 3, name: 'Вера', team: 'Дизайн', blocked: true },
	{ id: 4, name: 'Глеб', team: 'Разработка' }
];
const base = { getKey: (user: User) => user.id, getLabel: (user: User) => user.name };

describe('flattenRows', () => {
	it('без groupBy: только опции с последовательным optionIndex и groupIndex -1', () => {
		const rows = flattenRows(users, base);
		expect(rows.map((row) => row.kind)).toEqual(['option', 'option', 'option', 'option']);
		expect(rows.map((row) => (row.kind === 'option' ? row.optionIndex : null))).toEqual([0, 1, 2, 3]);
		expect(rows.map((row) => (row.kind === 'option' ? row.groupIndex : null))).toEqual([-1, -1, -1, -1]);
	});

	it('опция несёт ключ, подпись, элемент и признак отключения', () => {
		const rows = flattenRows(users, { ...base, isItemDisabled: (user) => user.blocked === true });
		expect(rows[2]).toEqual({ kind: 'option', key: 3, item: users[2], label: 'Вера', disabled: true, optionIndex: 2, groupIndex: -1 });
		expect(rows[0]).toMatchObject({ disabled: false });
	});

	it('groupBy: группы в порядке первого появления, внутри группы исходный порядок, заголовок перед опциями', () => {
		const rows = flattenRows(users, { ...base, groupBy: (user) => user.team });
		expect(rows.map((row) => (row.kind === 'group' ? `#${row.label}` : row.kind === 'option' ? row.label : '?'))).toEqual([
			'#Дизайн', 'Анна', 'Вера', '#Разработка', 'Борис', 'Глеб'
		]);
	});

	it('groupBy: optionIndex сквозной после перегруппировки, groupIndex равен номеру группы', () => {
		const rows = flattenRows(users, { ...base, groupBy: (user) => user.team });
		expect(rows.map((row) => (row.kind === 'option' ? row.optionIndex : -1))).toEqual([-1, 0, 1, -1, 2, 3]);
		expect(rows.map((row) => (row.kind === 'all' ? -2 : row.groupIndex))).toEqual([0, 0, 0, 1, 1, 1]);
		expect(rows[0]).toEqual({ kind: 'group', key: 'Дизайн', label: 'Дизайн', groupIndex: 0 });
	});

	it('пустой список даёт пустой результат, у единственной группы заголовок один', () => {
		expect(flattenRows([], { ...base, groupBy: (user: User) => user.team })).toEqual([]);
		const rows = flattenRows([users[0] as User], { ...base, groupBy: (user) => user.team });
		expect(rows.map((row) => row.kind)).toEqual(['group', 'option']);
	});

	it('allKey добавляет первой строку «Все» вне optionIndex; без опций её нет', () => {
		const rows = flattenRows(users, { ...base, allKey: -1 });
		expect(rows[0]).toEqual({ kind: 'all', key: -1 });
		expect(rows[1]).toMatchObject({ kind: 'option', optionIndex: 0 });
		expect(rows).toHaveLength(5);
		expect(flattenRows([], { ...base, allKey: -1 })).toEqual([]);
	});

	it('allKey с groupBy: «Все» стоит перед первым заголовком', () => {
		const rows = flattenRows(users, { ...base, allKey: -1, groupBy: (user) => user.team });
		expect(rows.map((row) => row.kind)).toEqual(['all', 'group', 'option', 'option', 'group', 'option', 'option']);
	});

	it('getLabel вызывается один раз на элемент', () => {
		const getLabel = vi.fn((user: User) => user.name);
		flattenRows(users, { getKey: base.getKey, getLabel, groupBy: (user) => user.team });
		expect(getLabel).toHaveBeenCalledTimes(users.length);
	});
});
