import { describe, expect, it } from 'vitest';

import { formatTimeText } from './format-time-text';

const at = (hour: number, minute: number) => ({ hour, minute });

describe('formatTimeText', () => {
	it.each([
		['ru', 0, 0, '00:00'],
		['ru', 9, 5, '09:05'],
		['ru', 14, 30, '14:30'],
		['ru', 23, 59, '23:59'],
		['de', 9, 5, '09:05'],
		['ja', 9, 5, '09:05'],
		['fi', 9, 5, '09.05']
	])('%s: %i:%i → %s', (locale, hour, minute, expected) => {
		expect(formatTimeText(at(hour, minute), locale)).toBe(expected);
	});

	it.each([
		[0, 0, '12:00 AM'],
		[0, 5, '12:05 AM'],
		[9, 5, '9:05 AM'],
		[11, 59, '11:59 AM'],
		[12, 0, '12:00 PM'],
		[14, 30, '2:30 PM'],
		[23, 59, '11:59 PM']
	])('en-US: %i:%i → %s', (hour, minute, expected) => {
		expect(formatTimeText(at(hour, minute), 'en-US')).toBe(expected);
	});

	it('hour12 переключает вид независимо от локали', () => {
		expect(formatTimeText(at(14, 30), 'ru', true)).toBe('2:30 PM');
		expect(formatTimeText(at(14, 30), 'en-US', false)).toBe('14:30');
	});

	it('ja в 12-часовом виде ставит период перед временем', () => {
		expect(formatTimeText(at(14, 30), 'ja', true)).toBe('午後2:30');
	});
});
