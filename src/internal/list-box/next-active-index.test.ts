import { describe, expect, it } from 'vitest';

import { nextActiveIndex } from './next-active-index';
import { buildRows } from './rows.test-helper';

// индексы: 0 #G1, 1 A, 2 !B, 3 C, 4 #G2, 5 D, 6 E
const rows = buildRows(['#G1', 'A', '!B', 'C', '#G2', 'D', 'E']);

describe('nextActiveIndex', () => {
	it('next пропускает отключённые и заголовки', () => {
		expect(nextActiveIndex(rows, 1, 'next', 5)).toBe(3);
		expect(nextActiveIndex(rows, 3, 'next', 5)).toBe(5);
	});

	it('previous пропускает отключённые и заголовки', () => {
		expect(nextActiveIndex(rows, 5, 'previous', 5)).toBe(3);
		expect(nextActiveIndex(rows, 3, 'previous', 5)).toBe(1);
	});

	it('без зацикливания: на краю остаётся на месте', () => {
		expect(nextActiveIndex(rows, 6, 'next', 5)).toBe(6);
		expect(nextActiveIndex(rows, 1, 'previous', 5)).toBe(1);
	});

	it('first и last берут крайние доступные строки', () => {
		expect(nextActiveIndex(rows, 3, 'first', 5)).toBe(1);
		expect(nextActiveIndex(rows, 3, 'last', 5)).toBe(6);
	});

	it('без текущей строки (-1): next, first и next-page дают первую доступную, остальные последнюю', () => {
		expect(nextActiveIndex(rows, -1, 'next', 5)).toBe(1);
		expect(nextActiveIndex(rows, -1, 'first', 5)).toBe(1);
		expect(nextActiveIndex(rows, -1, 'previous', 5)).toBe(6);
		expect(nextActiveIndex(rows, -1, 'last', 5)).toBe(6);
		expect(nextActiveIndex(rows, -1, 'next-page', 5)).toBe(1);
		expect(nextActiveIndex(rows, -1, 'previous-page', 5)).toBe(6);
	});

	it('индекс за пределами списка считается отсутствием текущей строки', () => {
		expect(nextActiveIndex(rows, 99, 'next', 5)).toBe(1);
	});

	it('нет доступных строк: всегда -1', () => {
		const empty = buildRows(['#G', '!A']);
		for (const command of ['next', 'previous', 'first', 'last', 'next-page', 'previous-page'] as const) {
			expect(nextActiveIndex(empty, 0, command, 3)).toBe(-1);
		}
		expect(nextActiveIndex([], -1, 'next', 3)).toBe(-1);
	});

	it('next-page прыгает на pageSize строк вниз, на заголовке идёт к следующей доступной', () => {
		const long = buildRows(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
		expect(nextActiveIndex(long, 0, 'next-page', 3)).toBe(3);
		expect(nextActiveIndex(long, 3, 'next-page', 3)).toBe(6);
		// цель 4 это заголовок
		expect(nextActiveIndex(rows, 1, 'next-page', 3)).toBe(5);
	});

	it('next-page у конца идёт на последнюю доступную, на самой последней остаётся', () => {
		const long = buildRows(['A', 'B', 'C', 'D', 'E']);
		expect(nextActiveIndex(long, 3, 'next-page', 10)).toBe(4);
		expect(nextActiveIndex(long, 4, 'next-page', 10)).toBe(4);
	});

	it('previous-page прыгает на pageSize строк вверх, у начала идёт на первую доступную', () => {
		const long = buildRows(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
		expect(nextActiveIndex(long, 7, 'previous-page', 3)).toBe(4);
		expect(nextActiveIndex(long, 1, 'previous-page', 3)).toBe(0);
		expect(nextActiveIndex(long, 0, 'previous-page', 3)).toBe(0);
		// цель 4 это заголовок, вверх до C
		expect(nextActiveIndex(rows, 5, 'previous-page', 1)).toBe(3);
	});

	it('pageSize меньше 1 считается единицей', () => {
		const long = buildRows(['A', 'B', 'C']);
		expect(nextActiveIndex(long, 0, 'next-page', 0)).toBe(1);
	});

	it('строка «Все» доступна для навигации', () => {
		const withAll = buildRows(['=Все', 'A', 'B']);
		expect(nextActiveIndex(withAll, -1, 'first', 3)).toBe(0);
		expect(nextActiveIndex(withAll, 1, 'previous', 3)).toBe(0);
	});
});
