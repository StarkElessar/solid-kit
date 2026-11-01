import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import { totalsLabelSpan } from './totals-label-span';

function column(id: string, locked = false): GridColumn<unknown> {
	return { id, title: id, value: () => 0, locked };
}

describe('totalsLabelSpan', () => {
	it('нет колонок: 1', () => {
		expect(totalsLabelSpan([], {})).toBe(1);
	});

	it('следующая колонка со значением: подпись занимает одну', () => {
		expect(totalsLabelSpan([column('a'), column('b')], { b: 1 })).toBe(1);
	});

	it('идущие за подписью колонки без значений входят в неё до первой со значением', () => {
		expect(totalsLabelSpan([column('a'), column('b'), column('c'), column('d')], { d: 1 })).toBe(3);
	});

	it('значение первой колонки игнорируется, а колонки после значения не входят в подпись', () => {
		expect(totalsLabelSpan([column('a'), column('b'), column('c')], { a: 5, c: 1 })).toBe(2);
	});

	it('без значений подпись занимает все колонки', () => {
		expect(totalsLabelSpan([column('a'), column('b'), column('c')], {})).toBe(3);
	});

	it('подпись закреплённой колонки не заходит на открепляемые', () => {
		expect(totalsLabelSpan([column('a', true), column('b', true), column('c')], {})).toBe(2);
	});

	it('пустое значение undefined равно отсутствию', () => {
		expect(totalsLabelSpan([column('a'), column('b')], { b: undefined })).toBe(2);
	});
});
