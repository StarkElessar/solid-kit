import { afterEach, describe, expect, it } from 'vitest';

import { readTokenPx } from './read-token-px';

function makeElement(properties: Record<string, string>): HTMLElement {
	const element = document.createElement('div');
	for (const [name, value] of Object.entries(properties)) {
		element.style.setProperty(name, value);
	}
	document.body.append(element);
	return element;
}

describe('readTokenPx', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it('берёт первый подходящий токен по порядку', () => {
		const element = makeElement({ '--a': '10px', '--b': '20px' });
		expect(readTokenPx(element, ['--a', '--b'], 1)).toBe(10);
		expect(readTokenPx(element, ['--b', '--a'], 1)).toBe(20);
	});

	it('пропускает отсутствующие, нулевые и нечисловые значения', () => {
		const element = makeElement({ '--zero': '0px', '--junk': 'auto', '--ok': '7px' });
		expect(readTokenPx(element, ['--missing', '--zero', '--junk', '--ok'], 1)).toBe(7);
	});

	it('без подходящих токенов: fallback', () => {
		expect(readTokenPx(makeElement({}), ['--a'], 320)).toBe(320);
	});
});
