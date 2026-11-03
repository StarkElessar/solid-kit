import { describe, expect, it } from 'vitest';

import { parseIsoDateTime } from './parse-iso-date-time';

describe('parseIsoDateTime', () => {
	it('разбирает YYYY-MM-DDTHH:mm', () => {
		expect(parseIsoDateTime('2026-11-03T14:30')).toEqual({
			date: { year: 2026, month: 11, day: 3 },
			time: { hour: 14, minute: 30 }
		});
		expect(parseIsoDateTime('2026-02-28T00:00')?.time).toEqual({ hour: 0, minute: 0 });
	});

	it.each([
		'',
		'2026-11-03',
		'14:30',
		'2026-11-03 14:30',
		'2026-11-03T14:30:00',
		'2026-11-03T14:30Z',
		'2026-11-03T24:00',
		'2026-11-03T14:60',
		'2026-11-03T9:30',
		'2026-02-30T10:00',
		'2026-13-01T10:00',
		'0000-01-01T10:00'
	])('отклоняет %j', (text) => {
		expect(parseIsoDateTime(text)).toBeNull();
	});
});
