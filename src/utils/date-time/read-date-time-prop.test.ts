import { afterEach, describe, expect, it, vi } from 'vitest';

import { readDateTimeProp } from './read-date-time-prop';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('readDateTimeProp', () => {
	it('разбирает допустимое значение без предупреждений', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readDateTimeProp('DateTimePicker', 'min', '2026-11-03T09:30')?.time).toEqual({ hour: 9, minute: 30 });
		expect(warn).not.toHaveBeenCalled();
	});

	it.each([undefined, null, ''])('пустое %j даёт undefined молча', (text) => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readDateTimeProp('DateTimePicker', 'min', text)).toBeUndefined();
		expect(warn).not.toHaveBeenCalled();
	});

	it('недопустимое значение даёт undefined и предупреждение с именем компонента и пропа', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readDateTimeProp('DateTimePicker', 'max', '2026-11-03')).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain('DateTimePicker: max');
	});
});
