import { describe, expect, it } from 'vitest';

import { countText, isAllChecked, isAllValue, selectedCount, toggleAll, toggleItem, valueItems } from './multiselect-value';

const items = ['a', 'b', 'c', 'd'];
const context = { getKey: (item: string): string => item, allKey: -1 as string | number | undefined };

describe('isAllValue и valueItems', () => {
	it('«Все» только когда значение равно allKey', () => {
		expect(isAllValue(-1, -1)).toBe(true);
		expect(isAllValue(-2, -1)).toBe(false);
		expect(isAllValue(['a'], -1)).toBe(false);
		expect(isAllValue(-1, undefined)).toBe(false);
	});

	it('valueItems: массив как есть, остальное пусто', () => {
		expect(valueItems(['a', 'b'])).toEqual(['a', 'b']);
		expect(valueItems(-1)).toEqual([]);
	});
});

describe('selectedCount', () => {
	it('для «Все» равно общему числу', () => {
		expect(selectedCount(-1, -1, 43)).toBe(43);
		expect(selectedCount(['a', 'b'], -1, 43)).toBe(2);
		expect(selectedCount([], -1, 43)).toBe(0);
	});
});

describe('toggleItem', () => {
	it('добавляет в конец и снимает; порядок выбора сохраняется', () => {
		expect(toggleItem(['b'], 'a', items, context)).toEqual(['b', 'a']);
		expect(toggleItem(['b', 'a'], 'b', items, context)).toEqual(['a']);
	});

	it('снятие опции при «Все» даёт массив всех остальных', () => {
		expect(toggleItem(-1, 'b', items, context)).toEqual(['a', 'c', 'd']);
	});
});

describe('toggleAll', () => {
	const base = { ...context, items, shown: items, filtered: false, checked: false };

	it('без поиска: выбирает «Все» и снимает', () => {
		expect(toggleAll([], base)).toBe(-1);
		expect(toggleAll(-1, { ...base, checked: true })).toEqual([]);
		expect(toggleAll(['a', 'b', 'c', 'd'], { ...base, checked: true })).toEqual([]);
	});

	it('с поиском добавляет показанные доступные, остальное не трогает', () => {
		const options = { ...base, shown: ['b', 'c'], filtered: true, isItemDisabled: (item: string) => item === 'c' };
		expect(toggleAll(['a'], options)).toEqual(['a', 'b']);
	});

	it('с поиском и отметкой снимает только показанные', () => {
		const options = { ...base, shown: ['b', 'c'], filtered: true, checked: true };
		expect(toggleAll(['a', 'b', 'c'], options)).toEqual(['a']);
		expect(toggleAll(-1, options)).toEqual(['a', 'd']);
	});
});

describe('isAllChecked', () => {
	it('«Все» стоит при allKey и когда выбраны все показанные доступные', () => {
		expect(isAllChecked(-1, items, context)).toBe(true);
		expect(isAllChecked(['a', 'b', 'c', 'd'], items, context)).toBe(true);
		expect(isAllChecked(['a', 'b'], items, context)).toBe(false);
		expect(isAllChecked(['a', 'b', 'd'], items, context, (item) => item === 'c')).toBe(true);
	});

	it('пустой список показанных не отмечен', () => {
		expect(isAllChecked([], [], context)).toBe(false);
	});
});

describe('countText', () => {
	it('«N из M», пусто при нуле и «N выбрано» при N больше M', () => {
		expect(countText(0, 10)).toBe('');
		expect(countText(3, 10)).toBe('3 из 10');
		expect(countText(43, 43)).toBe('43 из 43');
		expect(countText(12, 10)).toBe('12 выбрано');
	});
});
