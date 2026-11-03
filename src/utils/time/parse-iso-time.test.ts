import { describe, expect, it } from 'vitest';

import { formatIsoTime } from './format-iso-time';
import { parseIsoTime } from './parse-iso-time';

describe('parseIsoTime и formatIsoTime', () => {
	it.each([
		['00:00', 0, 0],
		['09:05', 9, 5],
		['14:30', 14, 30],
		['23:59', 23, 59]
	])('%s разбирается и записывается обратно', (text, hour, minute) => {
		expect(parseIsoTime(text)).toEqual({ hour, minute });
		expect(formatIsoTime({ hour, minute })).toBe(text);
	});

	it.each(['9:05', '24:00', '12:60', '12:5', '09:05:00', '', ' 09:05', '09:05 ', '0905', '09-05', 'ab:cd', '-1:00'])(
		'%j не разбирается',
		(text) => {
			expect(parseIsoTime(text)).toBeNull();
		}
	);
});
