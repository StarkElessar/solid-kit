import { describe, expect, it } from 'vitest';

import { dateMaskSpec } from '../date/date-mask-spec';
import { dateTimeMaskSpec } from '../date-time/date-time-mask-spec';
import { timeMaskSpec } from '../time/time-mask-spec';

import type { MaskSpec } from './mask-spec';
import { maskText } from './mask-text';

function orFail(spec: MaskSpec | null): MaskSpec {
	if (!spec) {
		throw new Error('Маска не построена');
	}
	return spec;
}

const date = dateMaskSpec('ru');
const time24 = orFail(timeMaskSpec('ru'));
const time12 = orFail(timeMaskSpec('en-US'));
const dateTime = orFail(dateTimeMaskSpec('ru'));
const dateTime12 = orFail(dateTimeMaskSpec('en-US'));

describe('maskText: дата (ru)', () => {
	it.each([
		['', ''],
		['0', '0'],
		['03', '03.'],
		['031', '03.1'],
		['0311', '03.11.'],
		['03112026', '03.11.2026'],
		['031120261234', '03.11.2026'],
		['03.11.2026', '03.11.2026'],
		['03/11/2026', '03.11.2026'],
		['03-11-2026', '03.11.2026'],
		['03 11 2026', '03.11.2026'],
		['abc', ''],
		['0a3', '03.'],
		['3', '3'],
		['4', '04.'],
		['9', '09.'],
		['04.2', '04.02.'],
		['3.', '03.'],
		['3.1', '03.1'],
		['3.1.', '03.01.'],
		['3.11.2026', '03.11.2026'],
		['.', ''],
		['..', ''],
		['03..11', '03.11.'],
		['03.11.2026.', '03.11.2026'],
		['03.11.2026 ', '03.11.2026'],
		['31.12.026', '31.12.026']
	])('%j даёт %j', (raw, expected) => {
		expect(maskText(raw, '', date)).toBe(expected);
	});

	it('идемпотентна на готовых значениях', () => {
		for (const text of ['03.11.2026', '03.', '03.1', '']) {
			expect(maskText(text, text, date)).toBe(text);
		}
	});

	it('удаление не воскрешает разделитель', () => {
		expect(maskText('03', '03.', date)).toBe('03');
		expect(maskText('0', '03', date)).toBe('0');
		expect(maskText('03.1', '03.11', date)).toBe('03.1');
		expect(maskText('03.', '03.1', date)).toBe('03.');
		expect(maskText('03', '03.', date)).toBe('03');
	});

	it('набор после удаления снова ставит разделитель', () => {
		expect(maskText('03', '0', date)).toBe('03.');
	});

	it('набор одних отвергнутых символов текст не меняет, где бы они ни стояли', () => {
		expect(maskText('03x.11.2026', '03.11.2026', date)).toBe('03.11.2026');
		expect(maskText('x03.11.2026', '03.11.2026', date)).toBe('03.11.2026');
		expect(maskText('03.11.2026x', '03.11.2026', date)).toBe('03.11.2026');
		expect(maskText('03x.11.2026', '03.11.2026', dateTime)).toBe('03.11.2026');
		expect(maskText('03.11.2026 x', '03.11.2026 ', dateTime)).toBe('03.11.2026 ');
		expect(maskText('2:30 pmx', '2:30 pm', time12)).toBe('2:30 pm');
	});

	it('замена выделенного одним символом считается набором, а не удалением', () => {
		expect(maskText('4', '03.11.2026', date)).toBe('04.');
	});
});

describe('maskText: дата в других локалях', () => {
	it('en-US: месяц первым', () => {
		const spec = dateMaskSpec('en-US');
		expect(maskText('11032026', '', spec)).toBe('11/03/2026');
		expect(maskText('2', '', spec)).toBe('02/');
		expect(maskText('4', '', spec)).toBe('04/');
	});

	it('ja: год первым', () => {
		const spec = dateMaskSpec('ja');
		expect(maskText('20261103', '', spec)).toBe('2026/11/03');
		expect(maskText('2026', '', spec)).toBe('2026/');
		expect(maskText('2026.11.03', '', spec)).toBe('2026/11/03');
	});
});

describe('maskText: время 24 часа', () => {
	it.each([
		['9', '09:'],
		['2', '2'],
		['20', '20:'],
		['1430', '14:30'],
		['930', '09:30'],
		['0930', '09:30'],
		['14:30', '14:30'],
		['14.30', '14:30'],
		['14 30', '14:30'],
		['9:5', '09:5'],
		['9:', '09:'],
		['14:305', '14:30'],
		[':', ''],
		['ab', ''],
		['2pm', '2']
	])('%j даёт %j', (raw, expected) => {
		expect(maskText(raw, '', time24)).toBe(expected);
	});

	it('удаление не воскрешает разделитель', () => {
		expect(maskText('14', '14:', time24)).toBe('14');
	});
});

describe('maskText: время 12 часов', () => {
	it.each([
		['2', '2:'],
		['1', '1'],
		['11', '11:'],
		['14', '14:'],
		['230', '2:30'],
		['2:30', '2:30'],
		['2:30p', '2:30 p'],
		['2:30pm', '2:30 pm'],
		['2:30 PM', '2:30 PM'],
		['2:30 p.m.', '2:30 p.m.'],
		['2:30pmxyz', '2:30 pm'],
		['11pm', '11 pm'],
		['2pm', '2 pm'],
		['pm', ''],
		['2:30 pm7', '2:30 pm'],
		['2:30 pm.', '2:30 pm.']
	])('%j даёт %j', (raw, expected) => {
		expect(maskText(raw, '', time12)).toBe(expected);
	});

	it('удаление буквы периода не оставляет пробел', () => {
		expect(maskText('2:30 ', '2:30 p', time12)).toBe('2:30');
	});
});

describe('maskText: дата со временем', () => {
	it.each([
		['031120261430', '03.11.2026 14:30'],
		['03.11.2026 14:30', '03.11.2026 14:30'],
		['03.11.2026', '03.11.2026 '],
		['03.11.2026 ', '03.11.2026 '],
		['03112026 9', '03.11.2026 09:'],
		['03.11.2026 1', '03.11.2026 1'],
		['3.1.2026 9:30', '03.01.2026 09:30'],
		['17:25', '17.02.5'],
		['0311202614309', '03.11.2026 14:30']
	])('%j даёт %j', (raw, expected) => {
		expect(maskText(raw, '', dateTime)).toBe(expected);
	});

	it('удаление пробела после даты не воскрешает его', () => {
		expect(maskText('03.11.2026', '03.11.2026 ', dateTime)).toBe('03.11.2026');
		expect(maskText('03.11.202', '03.11.2026', dateTime)).toBe('03.11.202');
	});

	it('пробел после начатого года переводит ко времени', () => {
		expect(maskText('03.11.2026 ', '03.11.202', dateTime)).toBe('03.11.2026 ');
		expect(maskText('03.11.20 9', '', dateTime)).toBe('03.11.20 09:');
	});

	it('12 часов: период после времени', () => {
		expect(maskText('11032026 230pm', '', dateTime12)).toBe('11/03/2026 2:30 pm');
		expect(maskText('11/03/2026 2:30 PM', '', dateTime12)).toBe('11/03/2026 2:30 PM');
	});
});
