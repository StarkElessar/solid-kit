import { describe, expect, it } from 'vitest';

import { dateTimePlaceholder } from './date-time-placeholder';
import { DEFAULT_DATE_TIME_PICKER_LABELS } from './default-date-time-picker-labels';

const labels = DEFAULT_DATE_TIME_PICKER_LABELS;

describe('dateTimePlaceholder', () => {
	it('ru: 24 часа', () => {
		expect(dateTimePlaceholder('ru', undefined, labels)).toBe('дд.мм.гггг чч:мм');
	});

	it('en-US: порядок даты и период после времени', () => {
		expect(dateTimePlaceholder('en-US', undefined, labels)).toBe('мм/дд/гггг чч:мм AM/PM');
	});

	it('hour12 перекрывает цикл локали', () => {
		expect(dateTimePlaceholder('ru', true, labels)).toBe('дд.мм.гггг чч:мм AM/PM');
		expect(dateTimePlaceholder('en-US', false, labels)).toBe('мм/дд/гггг чч:мм');
	});

	it('использует переданные названия', () => {
		expect(dateTimePlaceholder('ru', false, { ...labels, day: 'DD', month: 'MM', year: 'YYYY', hourPart: 'HH', minutePart: 'mm' }))
			.toBe('DD.MM.YYYY HH:mm');
	});
});
