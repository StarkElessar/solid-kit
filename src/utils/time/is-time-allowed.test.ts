import { describe, expect, it, vi } from 'vitest';

import { isTimeAllowed } from './is-time-allowed';

const t = (hour: number, minute: number) => ({ hour, minute });

describe('isTimeAllowed', () => {
	it('без ограничений допускает любое время', () => {
		expect(isTimeAllowed(t(0, 0))).toBe(true);
		expect(isTimeAllowed(t(23, 59))).toBe(true);
	});

	it('границы включительно', () => {
		const min = t(9, 0);
		const max = t(18, 30);
		expect(isTimeAllowed(t(8, 59), min, max)).toBe(false);
		expect(isTimeAllowed(t(9, 0), min, max)).toBe(true);
		expect(isTimeAllowed(t(18, 30), min, max)).toBe(true);
		expect(isTimeAllowed(t(18, 31), min, max)).toBe(false);
	});

	it('работает с одной границей', () => {
		expect(isTimeAllowed(t(8, 0), t(9, 0))).toBe(false);
		expect(isTimeAllowed(t(20, 0), undefined, t(18, 0))).toBe(false);
	});

	it('предикат получает HH:mm и может запретить время', () => {
		const isDisabled = vi.fn((time: string) => time === '12:00');
		expect(isTimeAllowed(t(12, 0), undefined, undefined, isDisabled)).toBe(false);
		expect(isDisabled).toHaveBeenCalledWith('12:00');
		expect(isTimeAllowed(t(12, 1), undefined, undefined, isDisabled)).toBe(true);
	});
});
