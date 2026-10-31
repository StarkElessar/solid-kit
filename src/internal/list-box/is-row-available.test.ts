import { describe, expect, it } from 'vitest';

import { isRowAvailable } from './is-row-available';
import { buildRows } from './rows.test-helper';

describe('isRowAvailable', () => {
	const [group, option, disabled, all] = buildRows(['#Группа', 'A', '!B', '=Все']);

	it('опция и строка «Все» доступны', () => {
		expect(isRowAvailable(option)).toBe(true);
		expect(isRowAvailable(all)).toBe(true);
	});

	it('заголовок, отключённая опция и отсутствие строки недоступны', () => {
		expect(isRowAvailable(group)).toBe(false);
		expect(isRowAvailable(disabled)).toBe(false);
		expect(isRowAvailable(undefined)).toBe(false);
	});
});
