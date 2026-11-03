import { afterEach, describe, expect, it, vi } from 'vitest';

import { todayIso } from './today-iso';

describe('todayIso', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('берёт локальные компоненты даты, а не UTC', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 10, 2, 23, 59));
		expect(todayIso()).toBe('2026-11-02');
		vi.setSystemTime(new Date(2026, 0, 5, 0, 1));
		expect(todayIso()).toBe('2026-01-05');
	});
});
