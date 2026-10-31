import { describe, expect, it } from 'vitest';

import { matchTypeahead } from './match-typeahead';
import { buildRows } from './rows.test-helper';

// индексы: 0 #Фрукты, 1 Абрикос, 2 Апельсин, 3 !Арбуз, 4 Банан, 5 Ананас, 6 =Все
const rows = buildRows(['#Фрукты', 'Абрикос', 'Апельсин', '!Арбуз', 'Банан', 'Ананас', '=Все']);

describe('matchTypeahead', () => {
	it('первая доступная опция, подпись которой начинается с буфера, регистр не важен', () => {
		expect(matchTypeahead(rows, -1, 'б')).toBe(4);
		expect(matchTypeahead(rows, -1, 'БАН')).toBe(4);
	});

	it('поиск идёт от текущей строки включительно и по кругу', () => {
		expect(matchTypeahead(rows, 2, 'ап')).toBe(2);
		expect(matchTypeahead(rows, 3, 'аб')).toBe(1);
	});

	it('отключённые опции, заголовки и «Все» не находятся', () => {
		expect(matchTypeahead(rows, -1, 'арб')).toBe(-1);
		expect(matchTypeahead(rows, -1, 'фру')).toBe(-1);
		expect(matchTypeahead(rows, -1, 'вс')).toBe(-1);
	});

	it('пустой буфер и отсутствие совпадения дают -1', () => {
		expect(matchTypeahead(rows, 1, '')).toBe(-1);
		expect(matchTypeahead(rows, 1, 'я')).toBe(-1);
		expect(matchTypeahead([], -1, 'а')).toBe(-1);
	});

	it('повтор одной буквы идёт к следующей опции на эту букву, по кругу', () => {
		expect(matchTypeahead(rows, 1, 'аа')).toBe(2);
		expect(matchTypeahead(rows, 2, 'ааа')).toBe(5);
		expect(matchTypeahead(rows, 5, 'аа')).toBe(1);
	});

	it('повтор буквы при единственной подходящей опции остаётся на ней', () => {
		expect(matchTypeahead(rows, 4, 'бб')).toBe(4);
	});

	it('индекс вне списка начинает поиск с начала', () => {
		expect(matchTypeahead(rows, 99, 'а')).toBe(1);
	});
});
