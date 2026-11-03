import { describe, expect, it } from 'vitest';

import { floorToStep } from './floor-to-step';
import { minuteOptions } from './minute-options';

describe('minuteOptions', () => {
	it('шаг 1 даёт 60 минут', () => {
		const all = minuteOptions(1);
		expect(all).toHaveLength(60);
		expect(all[0]).toBe(0);
		expect(all.at(-1)).toBe(59);
	});

	it.each([
		[5, 12, 55],
		[15, 4, 45],
		[30, 2, 30],
		[20, 3, 40]
	])('шаг %i даёт %i значений, последнее %i', (step, count, last) => {
		const options = minuteOptions(step);
		expect(options).toHaveLength(count);
		expect(options.at(-1)).toBe(last);
	});
});

describe('floorToStep', () => {
	it.each([
		[0, 15, 0],
		[14, 15, 0],
		[15, 15, 15],
		[44, 15, 30],
		[59, 15, 45],
		[59, 1, 59],
		[37, 5, 35]
	])('%i при шаге %i даёт %i', (minute, step, expected) => {
		expect(floorToStep(minute, step)).toBe(expected);
	});
});
