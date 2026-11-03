import { afterEach, describe, expect, it, vi } from 'vitest';

import { readDateProp } from './read-date-prop';

describe('readDateProp', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('разбирает корректную дату', () => {
		expect(readDateProp('Calendar', 'value', '2026-11-02')).toEqual({ year: 2026, month: 11, day: 2 });
	});

	it('пусто даёт undefined без предупреждения', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readDateProp('Calendar', 'value', undefined)).toBeUndefined();
		expect(readDateProp('Calendar', 'value', null)).toBeUndefined();
		expect(readDateProp('Calendar', 'value', '')).toBeUndefined();
		expect(warn).not.toHaveBeenCalled();
	});

	it('недопустимая строка предупреждает и даёт undefined', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readDateProp('Calendar', 'min', '2026-02-30')).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain('Calendar: min');
	});
});
