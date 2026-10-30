import { describe, expect, it } from 'vitest';

import { nextMenuItemIndex } from './menu-navigation';

const ALL = [false, false, false];
const MIDDLE_DISABLED = [false, true, false];

describe('nextMenuItemIndex', () => {
	it('ArrowDown and ArrowUp go around the circle', () => {
		expect(nextMenuItemIndex('ArrowDown', 0, ALL)).toBe(1);
		expect(nextMenuItemIndex('ArrowDown', 2, ALL)).toBe(0);
		expect(nextMenuItemIndex('ArrowUp', 1, ALL)).toBe(0);
		expect(nextMenuItemIndex('ArrowUp', 0, ALL)).toBe(2);
	});

	it('skips disabled items in both directions', () => {
		expect(nextMenuItemIndex('ArrowDown', 0, MIDDLE_DISABLED)).toBe(2);
		expect(nextMenuItemIndex('ArrowUp', 2, MIDDLE_DISABLED)).toBe(0);
	});

	it('Home and End take the first and the last enabled item', () => {
		expect(nextMenuItemIndex('Home', 2, [true, false, false])).toBe(1);
		expect(nextMenuItemIndex('End', 0, [false, false, true])).toBe(1);
	});

	it('with no current item ArrowDown takes the first and ArrowUp the last enabled one', () => {
		expect(nextMenuItemIndex('ArrowDown', -1, [true, false, false])).toBe(1);
		expect(nextMenuItemIndex('ArrowUp', -1, [false, false, true])).toBe(1);
	});

	it('returns the only enabled item for any arrow, even from itself', () => {
		expect(nextMenuItemIndex('ArrowDown', 1, [true, false, true])).toBe(1);
	});

	it('returns null for an empty menu, a menu of disabled items and non-navigation keys', () => {
		expect(nextMenuItemIndex('ArrowDown', -1, [])).toBeNull();
		expect(nextMenuItemIndex('Home', -1, [true, true])).toBeNull();
		expect(nextMenuItemIndex('a', 0, ALL)).toBeNull();
		expect(nextMenuItemIndex('ArrowRight', 0, ALL)).toBeNull();
	});
});
