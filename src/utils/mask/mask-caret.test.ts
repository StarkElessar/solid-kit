import { describe, expect, it } from 'vitest';

import { caretAfterDigits, digitsBefore } from './mask-caret';

describe('digitsBefore', () => {
	it('считает цифры левее позиции', () => {
		expect(digitsBefore('03.11.2026', 0)).toBe(0);
		expect(digitsBefore('03.11.2026', 3)).toBe(2);
		expect(digitsBefore('03.11.2026', 10)).toBe(8);
	});
});

describe('caretAfterDigits', () => {
	it('ставит курсор после N-й цифры и пропускает разделители', () => {
		expect(caretAfterDigits('03.11.2026', 0)).toBe(0);
		expect(caretAfterDigits('03.11.2026', 1)).toBe(1);
		expect(caretAfterDigits('03.11.2026', 2)).toBe(3);
		expect(caretAfterDigits('03.11.2026', 4)).toBe(6);
		expect(caretAfterDigits('03.11.2026', 8)).toBe(10);
	});

	it('при избытке цифр ставит курсор после последней', () => {
		expect(caretAfterDigits('03.1', 9)).toBe(4);
	});
});
