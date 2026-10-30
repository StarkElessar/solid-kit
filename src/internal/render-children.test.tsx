import { describe, expect, it, vi } from 'vitest';

import { renderChildren } from './render-children';

describe('renderChildren', () => {
	it('passes ordinary children through', () => {
		expect(renderChildren('text', { n: 1 })).toBe('text');
	});

	it('calls a function child with the state once', () => {
		const child = vi.fn((state: { n: number }) => `n=${state.n}`);
		expect(renderChildren(child, { n: 2 })).toBe('n=2');
		expect(child).toHaveBeenCalledOnce();
	});

	it('leaves a function without parameters to Solid (it is an ordinary child)', () => {
		const child = (): string => 'lazy';
		expect(renderChildren(child, { n: 3 })).toBe(child);
	});
});
