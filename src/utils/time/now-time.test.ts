import { afterEach, describe, expect, it, vi } from 'vitest';

import { nowTime } from './now-time';

afterEach(() => {
	vi.useRealTimers();
});

describe('nowTime', () => {
	it('берёт локальные часы и минуты, а не UTC', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 10, 3, 23, 59));
		expect(nowTime()).toEqual({ hour: 23, minute: 59 });
		vi.setSystemTime(new Date(2026, 10, 3, 0, 5));
		expect(nowTime()).toEqual({ hour: 0, minute: 5 });
	});
});
