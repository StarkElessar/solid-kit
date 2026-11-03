import { describe, expect, it } from 'vitest';

import { isDateTimeAllowed } from './is-date-time-allowed';
import { parseIsoDateTime } from './parse-iso-date-time';

function at(text: string) {
	const parts = parseIsoDateTime(text);
	if (!parts) {
		throw new Error(`Некорректное значение ${text}`);
	}
	return parts;
}

describe('isDateTimeAllowed', () => {
	it('без ограничений допускает любое значение', () => {
		expect(isDateTimeAllowed(at('2026-11-03T14:30'), { step: 1 })).toBe(true);
	});

	it('границы включительно и зависят от даты', () => {
		const rules = { min: at('2026-11-03T09:00'), max: at('2026-11-10T18:30'), step: 1 };
		expect(isDateTimeAllowed(at('2026-11-03T08:59'), rules)).toBe(false);
		expect(isDateTimeAllowed(at('2026-11-03T09:00'), rules)).toBe(true);
		expect(isDateTimeAllowed(at('2026-11-04T08:00'), rules)).toBe(true);
		expect(isDateTimeAllowed(at('2026-11-10T18:30'), rules)).toBe(true);
		expect(isDateTimeAllowed(at('2026-11-10T18:31'), rules)).toBe(false);
		expect(isDateTimeAllowed(at('2026-11-11T00:00'), rules)).toBe(false);
	});

	it('isDateDisabled получает YYYY-MM-DD и запрещает дату', () => {
		const rules = { isDateDisabled: (date: string) => date === '2026-11-07', step: 1 };
		expect(isDateTimeAllowed(at('2026-11-07T10:00'), rules)).toBe(false);
		expect(isDateTimeAllowed(at('2026-11-08T10:00'), rules)).toBe(true);
	});

	it('isTimeDisabled получает HH:mm и действует на любой дате', () => {
		const rules = { isTimeDisabled: (time: string) => time === '12:00', step: 1 };
		expect(isDateTimeAllowed(at('2026-11-03T12:00'), rules)).toBe(false);
		expect(isDateTimeAllowed(at('2026-11-09T12:00'), rules)).toBe(false);
		expect(isDateTimeAllowed(at('2026-11-09T12:01'), rules)).toBe(true);
	});
});
