import { describe, expect, it } from 'vitest';

import { sameItems } from './same-items';

describe('sameItems', () => {
	it('одинаковые элементы в том же порядке равны', () => {
		const item = { id: 1 };
		expect(sameItems([item, 2], [item, 2])).toBe(true);
		expect(sameItems([], [])).toBe(true);
	});

	it('разная длина или порядок не равны', () => {
		expect(sameItems([1, 2], [1])).toBe(false);
		expect(sameItems([1, 2], [2, 1])).toBe(false);
	});

	it('объекты сравниваются по ссылке', () => {
		expect(sameItems([{ id: 1 }], [{ id: 1 }])).toBe(false);
	});
});
