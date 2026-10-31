import { describe, expect, it } from 'vitest';

import { optionId } from './option-id';

describe('optionId', () => {
	it('строится из id списка и ключа', () => {
		expect(optionId('list', 'abc')).toBe('list-opt-sabc');
		expect(optionId('list', 5)).toBe('list-opt-n5');
	});

	it('число и строка с одним значением различаются', () => {
		expect(optionId('l', 1)).not.toBe(optionId('l', '1'));
	});

	it('пробелы и кириллица кодируются, пробелов в результате нет', () => {
		const id = optionId('l', 'Анна Иванова');
		expect(id).not.toMatch(/\s/);
		expect(id.startsWith('l-opt-s')).toBe(true);
		expect(optionId('l', 'Анна Иванова')).toBe(id);
	});

	it('разные ключи дают разные id', () => {
		expect(optionId('l', 'a b')).not.toBe(optionId('l', 'a%20b'));
	});
});
