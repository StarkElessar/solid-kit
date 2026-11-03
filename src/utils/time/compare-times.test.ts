import { describe, expect, it } from 'vitest';

import { compareTimes } from './compare-times';

describe('compareTimes', () => {
	it('знак по часам, затем по минутам, ноль при равенстве', () => {
		expect(compareTimes({ hour: 9, minute: 59 }, { hour: 10, minute: 0 })).toBeLessThan(0);
		expect(compareTimes({ hour: 10, minute: 1 }, { hour: 10, minute: 0 })).toBeGreaterThan(0);
		expect(compareTimes({ hour: 10, minute: 0 }, { hour: 10, minute: 0 })).toBe(0);
	});
});
