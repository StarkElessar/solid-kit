import { describe, expect, it } from 'vitest';

import { indentOf } from './indent-of-level';

describe('indentOf', () => {
	it('отступ растёт на 16 px за уровень', () => {
		expect(indentOf(0)).toBe(0);
		expect(indentOf(1)).toBe(16);
		expect(indentOf(3)).toBe(48);
	});
});
