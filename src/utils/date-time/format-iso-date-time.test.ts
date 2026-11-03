import { describe, expect, it } from 'vitest';

import { formatIsoDateTime } from './format-iso-date-time';
import { parseIsoDateTime } from './parse-iso-date-time';

describe('formatIsoDateTime', () => {
	it('пишет с ведущими нулями', () => {
		expect(formatIsoDateTime({ date: { year: 2026, month: 1, day: 5 }, time: { hour: 9, minute: 5 } })).toBe('2026-01-05T09:05');
		expect(formatIsoDateTime({ date: { year: 12, month: 11, day: 30 }, time: { hour: 0, minute: 0 } })).toBe('0012-11-30T00:00');
	});

	it.each(['2026-11-03T14:30', '2024-02-29T23:59', '0001-01-01T00:00', '9999-12-31T12:00'])('круг с разбором: %s', (text) => {
		const parsed = parseIsoDateTime(text);
		expect(parsed && formatIsoDateTime(parsed)).toBe(text);
	});
});
