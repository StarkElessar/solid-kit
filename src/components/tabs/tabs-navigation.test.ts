import { describe, expect, it } from 'vitest';

import { nextTabIndex } from './tabs-navigation';

describe('nextTabIndex', () => {
	it('moves by one with the arrows and wraps around', () => {
		expect(nextTabIndex('ArrowRight', 0, 3)).toBe(1);
		expect(nextTabIndex('ArrowRight', 2, 3)).toBe(0);
		expect(nextTabIndex('ArrowLeft', 1, 3)).toBe(0);
		expect(nextTabIndex('ArrowLeft', 0, 3)).toBe(2);
	});

	it('goes to the first and the last with Home and End', () => {
		expect(nextTabIndex('Home', 2, 3)).toBe(0);
		expect(nextTabIndex('End', 0, 3)).toBe(2);
	});

	it('starts from an end when the current tab is unknown and ignores other keys and empty lists', () => {
		expect(nextTabIndex('ArrowRight', -1, 3)).toBe(0);
		expect(nextTabIndex('ArrowLeft', -1, 3)).toBe(2);
		expect(nextTabIndex('ArrowDown', 0, 3)).toBeNull();
		expect(nextTabIndex('Enter', 0, 3)).toBeNull();
		expect(nextTabIndex('ArrowRight', -1, 0)).toBeNull();
	});
});
