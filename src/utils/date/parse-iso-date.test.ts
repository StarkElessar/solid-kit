import { describe, expect, it } from 'vitest';

import { formatIsoDate } from './format-iso-date';
import { parseIsoDate } from './parse-iso-date';

describe('parseIsoDate', () => {
	it('разбирает корректную дату', () => {
		expect(parseIsoDate('2026-11-02')).toEqual({ year: 2026, month: 11, day: 2 });
		expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
		expect(parseIsoDate('0001-01-01')).toEqual({ year: 1, month: 1, day: 1 });
	});

	it.each([
		'2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '0000-01-01',
		'2026-1-2', '26-11-02', '2026-11-02T10:00', '2026/11/02', '', ' 2026-11-02', '2026-11-02 '
	])('не принимает %j', (text) => {
		expect(parseIsoDate(text)).toBeNull();
	});
});

describe('formatIsoDate', () => {
	it('дополняет нулями', () => {
		expect(formatIsoDate({ year: 1, month: 1, day: 1 })).toBe('0001-01-01');
		expect(formatIsoDate({ year: 2026, month: 11, day: 2 })).toBe('2026-11-02');
	});

	it('обратима с parseIsoDate', () => {
		for (const text of ['0099-12-31', '2024-02-29', '9999-12-31']) {
			const parts = parseIsoDate(text);
			expect(parts && formatIsoDate(parts)).toBe(text);
		}
	});
});
