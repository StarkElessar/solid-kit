import { describe, expect, it } from 'vitest';

import { fromUtcTime } from './from-utc-time';
import { toUtcTime } from './to-utc-time';

describe('toUtcTime и fromUtcTime', () => {
	it.each([1, 99, 100, 1970, 2026, 9999])('год %i проходит круг без сдвига', (year) => {
		const parts = { year, month: 3, day: 9 };
		expect(fromUtcTime(toUtcTime(parts))).toEqual(parts);
	});

	it('полночь UTC даёт известную метку', () => {
		expect(toUtcTime({ year: 1970, month: 1, day: 2 })).toBe(86_400_000);
	});
});
