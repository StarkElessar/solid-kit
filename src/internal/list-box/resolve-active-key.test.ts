import { describe, expect, it } from 'vitest';

import { resolveActiveKey } from './resolve-active-key';
import { buildRows } from './rows.test-helper';

const rows = buildRows(['#G', '!A', 'B', 'C']);

describe('resolveActiveKey', () => {
	it('ключ остался среди доступных опций: подсветка сохраняется', () => {
		expect(resolveActiveKey(rows, 'C')).toBe('C');
	});

	it('ключ пропал, отключён или это заголовок: ключ первой доступной опции', () => {
		expect(resolveActiveKey(rows, 'X')).toBe('B');
		expect(resolveActiveKey(rows, 'A')).toBe('B');
		expect(resolveActiveKey(rows, 'G')).toBe('B');
	});

	it('без ключа: первая доступная', () => {
		expect(resolveActiveKey(rows, undefined)).toBe('B');
	});

	it('нет доступных строк: undefined', () => {
		expect(resolveActiveKey(buildRows(['#G', '!A']), 'A')).toBeUndefined();
		expect(resolveActiveKey([], 'A')).toBeUndefined();
	});

	it('числовой ключ не равен строковому', () => {
		expect(resolveActiveKey(buildRows(['1']), 1)).toBe('1');
	});
});
