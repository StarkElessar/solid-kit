import { describe, expect, it } from 'vitest';

import { DEFAULT_PAGE_SIZES } from './default-page-sizes';
import { mergePageSizes } from './merge-page-sizes';

describe('mergePageSizes', () => {
	it('размер из списка не дублируется', () => {
		expect(mergePageSizes([10, 20, 50], 20)).toEqual([10, 20, 50]);
	});

	it('размер вне списка добавляется по порядку', () => {
		expect(mergePageSizes([10, 20, 50], 25)).toEqual([10, 20, 25, 50]);
		expect(mergePageSizes([10, 20, 50], 5)).toEqual([5, 10, 20, 50]);
	});

	it('сортирует по возрастанию и не мутирует вход', () => {
		const sizes = [50, 10, 20];
		expect(mergePageSizes(sizes, 10)).toEqual([10, 20, 50]);
		expect(sizes).toEqual([50, 10, 20]);
	});
});

describe('DEFAULT_PAGE_SIZES', () => {
	it('набор владельца', () => {
		expect(DEFAULT_PAGE_SIZES).toEqual([10, 20, 50, 200, 500, 1000, 2000]);
	});
});
