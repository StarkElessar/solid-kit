import { describe, expect, it } from 'vitest';

import { defaultSummaryText } from './default-summary-text';

// разделитель тысяч в ICU бывает неразрывным и узким неразрывным пробелом: сравниваем с обычным
function plain(text: string): string {
	return text.replace(/\s/g, ' ');
}

describe('defaultSummaryText', () => {
	it.each([
		[{ from: 21, to: 40, total: 1250 }, 'Записей 21–40 из 1 250'],
		[{ from: 1241, to: 1250, total: 1250 }, 'Записей 1 241–1 250 из 1 250'],
		[{ from: 1, to: 7, total: 7 }, 'Записей 1–7 из 7'],
		[{ from: 0, to: 0, total: 0 }, 'Записей 0']
	])('%j → «%s»', (range, expected) => {
		expect(plain(defaultSummaryText(range))).toBe(expected);
	});
});
