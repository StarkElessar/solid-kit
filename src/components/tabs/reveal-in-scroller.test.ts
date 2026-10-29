import { describe, expect, it } from 'vitest';

import { revealInScroller } from './reveal-in-scroller';

function withRect(element: HTMLElement, left: number, right: number): HTMLElement {
	element.getBoundingClientRect = () => ({ left, right, top: 0, bottom: 0, width: right - left, height: 0, x: left, y: 0 }) as DOMRect;
	return element;
}

describe('revealInScroller', () => {
	it('scrolls to the right just enough to show an item that sticks out on the right', () => {
		const scroller = withRect(document.createElement('div'), 0, 100);
		const item = withRect(document.createElement('button'), 80, 180);
		scroller.scrollLeft = 10;
		revealInScroller(item, scroller);
		expect(scroller.scrollLeft).toBe(90);
	});

	it('scrolls to the left just enough to show an item that sticks out on the left', () => {
		const scroller = withRect(document.createElement('div'), 100, 200);
		const item = withRect(document.createElement('button'), 60, 140);
		scroller.scrollLeft = 50;
		revealInScroller(item, scroller);
		expect(scroller.scrollLeft).toBe(10);
	});

	it('does not scroll when the item is already fully visible', () => {
		const scroller = withRect(document.createElement('div'), 0, 100);
		const item = withRect(document.createElement('button'), 20, 60);
		scroller.scrollLeft = 30;
		revealInScroller(item, scroller);
		expect(scroller.scrollLeft).toBe(30);
	});
});
