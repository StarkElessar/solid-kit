import { describe, expect, it } from 'vitest';

import { toggleId } from './toggle-id';

describe('toggleId', () => {
	it('добавляет отсутствующий id в новый набор и не трогает исходный', () => {
		const source: ReadonlySet<string> = new Set(['a']);
		const next = toggleId(source, 'b');
		expect([...next]).toEqual(['a', 'b']);
		expect(next).not.toBe(source);
		expect([...source]).toEqual(['a']);
	});

	it('убирает присутствующий id', () => {
		const source: ReadonlySet<string> = new Set(['a', 'b']);
		expect([...toggleId(source, 'a')]).toEqual(['b']);
		expect([...source]).toEqual(['a', 'b']);
	});

	it('работает с пустым набором', () => {
		expect([...toggleId(new Set(), 'x')]).toEqual(['x']);
	});
});
