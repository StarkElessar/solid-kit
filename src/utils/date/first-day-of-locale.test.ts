import { describe, expect, it } from 'vitest';

import { firstDayOfLocale } from './first-day-of-locale';

describe('firstDayOfLocale', () => {
	it.each([
		['ru', 1], ['de', 1], ['en-US', 0], ['en', 0], ['ar-EG', 6], ['ja', 0]
	])('%s: %i', (locale, expected) => {
		expect(firstDayOfLocale(locale)).toBe(expected);
	});

	it('недопустимая строка локали даёт понедельник без исключения', () => {
		expect(firstDayOfLocale('!!')).toBe(1);
	});

	it('без getWeekInfo и weekInfo считает по региону', () => {
		const prototype = Intl.Locale.prototype as object;
		const saved = ['getWeekInfo', 'weekInfo'].map((name) => [name, Object.getOwnPropertyDescriptor(prototype, name)] as const);
		for (const [name] of saved) {
			Object.defineProperty(prototype, name, { value: undefined, configurable: true });
		}
		try {
			expect(new Intl.Locale('ru')).not.toHaveProperty('weekInfo.firstDay');
			expect(firstDayOfLocale('en-US')).toBe(0);
			expect(firstDayOfLocale('ru')).toBe(1);
			expect(firstDayOfLocale('ar-EG')).toBe(6);
		}
		finally {
			for (const [name, descriptor] of saved) {
				if (descriptor) {
					Object.defineProperty(prototype, name, descriptor);
				}
			}
		}
	});
});
