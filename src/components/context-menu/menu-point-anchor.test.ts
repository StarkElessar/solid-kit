import { describe, expect, it } from 'vitest';

import { elementPoint, pointAnchor } from './menu-point-anchor';

describe('pointAnchor', () => {
	it('is a zero-size rect at the point', () => {
		const rect = pointAnchor({ x: 12, y: 34 }).getBoundingClientRect();
		expect(rect).toMatchObject({ x: 12, y: 34, left: 12, right: 12, top: 34, bottom: 34, width: 0, height: 0 });
	});
});

describe('elementPoint', () => {
	it('is the bottom-left corner of the element', () => {
		const element = document.createElement('div');
		element.getBoundingClientRect = () => ({ left: 10, bottom: 50, top: 20, right: 90 }) as DOMRect;
		expect(elementPoint(element)).toEqual({ x: 10, y: 50 });
	});
});
