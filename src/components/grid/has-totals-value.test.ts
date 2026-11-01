import { describe, expect, it } from 'vitest';

import { hasTotalsValue } from './has-totals-value';

describe('hasTotalsValue', () => {
	it.each([
		[{ a: 1 }, 'a', true],
		[{ a: 0 }, 'a', true],
		[{ a: null }, 'a', true],
		[{ a: undefined }, 'a', false],
		[{}, 'a', false],
		[{}, 'constructor', false]
	])('%j, колонка %s: %s', (values, id, expected) => {
		expect(hasTotalsValue(id, values)).toBe(expected);
	});
});
