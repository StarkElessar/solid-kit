import { describe, expect, it } from 'vitest';

import { createDateFormats } from './create-date-formats';

describe('createDateFormats', () => {
	const ru = createDateFormats('ru');

	it('русские названия', () => {
		expect(ru.periodLabel(2026, 11)).toBe('ноябрь 2026');
		expect(ru.monthLong(3)).toBe('март');
		expect(ru.monthShort(11)).toBe('Нояб.');
		expect(ru.weekdayShort(1)).toBe('Пн');
		expect(ru.weekdayShort(0)).toBe('Вс');
		expect(ru.weekdayLong(0)).toBe('воскресенье');
		expect(ru.cellLabel({ year: 2026, month: 11, day: 1 })).toBe('воскресенье, 1 ноября 2026 г.');
		expect(ru.yearLabel(2026)).toBe('2026');
	});

	it('английская запись берёт порядок частей из локали', () => {
		const en = createDateFormats('en-US');
		expect(en.periodLabel(2026, 11)).toBe('November 2026');
		expect(en.weekdayShort(1)).toBe('Mon');
	});

	it('японская запись не теряет «月»', () => {
		const ja = createDateFormats('ja');
		expect(ja.periodLabel(2026, 11)).toBe('2026年11月');
	});

	it('год 1 не сдвигается на 1901', () => {
		expect(ru.yearLabel(1)).toBe('1');
		expect(ru.periodLabel(99, 5)).toBe('май 99');
	});

	it('результат кэшируется по локали', () => {
		expect(createDateFormats('ru')).toBe(ru);
		expect(createDateFormats('de')).not.toBe(ru);
	});
});
