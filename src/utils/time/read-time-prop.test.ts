import { afterEach, describe, expect, it, vi } from 'vitest';

import { readTimeProp } from './read-time-prop';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('readTimeProp', () => {
	it('разбирает допустимое время без предупреждений', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readTimeProp('TimePicker', 'min', '09:30')).toEqual({ hour: 9, minute: 30 });
		expect(warn).not.toHaveBeenCalled();
	});

	it.each([undefined, null, ''])('пустое %j даёт undefined молча', (text) => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readTimeProp('TimePicker', 'min', text)).toBeUndefined();
		expect(warn).not.toHaveBeenCalled();
	});

	it('недопустимое значение даёт undefined и предупреждение с именем компонента и пропа', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		expect(readTimeProp('TimePicker', 'max', '9:30')).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
		expect(String(warn.mock.calls[0]?.[0])).toContain('TimePicker: max');
	});
});
