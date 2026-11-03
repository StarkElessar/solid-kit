import { describe, expect, it } from 'vitest';

import { isDateAllowed } from './is-date-allowed';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('isDateAllowed', () => {
	it('без ограничений допустима', () => {
		expect(isDateAllowed(d(2026, 11, 3))).toBe(true);
	});

	it('границы включительно', () => {
		const min = d(2026, 11, 5);
		const max = d(2026, 11, 20);
		expect(isDateAllowed(d(2026, 11, 5), min, max)).toBe(true);
		expect(isDateAllowed(d(2026, 11, 20), min, max)).toBe(true);
		expect(isDateAllowed(d(2026, 11, 4), min, max)).toBe(false);
		expect(isDateAllowed(d(2026, 11, 21), min, max)).toBe(false);
	});

	it('пределы 0001 и 9999', () => {
		expect(isDateAllowed(d(0, 12, 31))).toBe(false);
		expect(isDateAllowed(d(10_000, 1, 1))).toBe(false);
		expect(isDateAllowed(d(1, 1, 1))).toBe(true);
		expect(isDateAllowed(d(9999, 12, 31))).toBe(true);
	});

	it('предикат получает ISO-строку и может запретить', () => {
		const seen: string[] = [];
		const predicate = (date: string) => {
			seen.push(date);
			return date.endsWith('-15');
		};
		expect(isDateAllowed(d(2026, 11, 15), undefined, undefined, predicate)).toBe(false);
		expect(isDateAllowed(d(2026, 11, 16), undefined, undefined, predicate)).toBe(true);
		expect(seen).toEqual(['2026-11-15', '2026-11-16']);
	});

	it('предикат не вызывается для дат вне границ', () => {
		let calls = 0;
		isDateAllowed(d(2026, 1, 1), d(2026, 11, 1), undefined, () => {
			calls += 1;
			return false;
		});
		expect(calls).toBe(0);
	});
});
