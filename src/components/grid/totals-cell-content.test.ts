import { describe, expect, it } from 'vitest';

import type { GridColumn } from './grid-column';
import { totalsCellContent } from './totals-cell-content';

const plain: GridColumn<unknown> = { id: 'sum', title: 'Сумма', value: () => 0 };

describe('totalsCellContent', () => {
	it('нет ключа: пусто', () => {
		expect(totalsCellContent(plain, {})).toBe('');
	});

	it('значение undefined равно отсутствию ключа и aggregate не вызывает', () => {
		let calls = 0;
		const column: GridColumn<unknown> = {
			...plain,
			aggregate: () => {
				calls += 1;
				return 'x';
			}
		};
		expect(totalsCellContent(column, { sum: undefined })).toBe('');
		expect(calls).toBe(0);
	});

	it('без aggregate значение форматируется как текст ячейки', () => {
		expect(totalsCellContent(plain, { sum: 1250 })).toBe('1250');
		expect(totalsCellContent(plain, { sum: { a: 1 } })).toBe('');
	});

	it('с aggregate значение отдаётся функции', () => {
		const column: GridColumn<unknown> = { ...plain, aggregate: (value) => `${String(value)} ₽` };
		expect(totalsCellContent(column, { sum: 5 })).toBe('5 ₽');
	});

	it('унаследованные ключи объекта не считаются значениями', () => {
		const column: GridColumn<unknown> = { ...plain, id: 'constructor' };
		expect(totalsCellContent(column, {})).toBe('');
	});
});
