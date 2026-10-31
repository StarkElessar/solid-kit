import { afterEach, describe, expect, it } from 'vitest';

import { readControlHeight } from './read-control-height';

function makeElement(properties: Record<string, string>): HTMLElement {
	const element = document.createElement('div');
	for (const [name, value] of Object.entries(properties)) {
		element.style.setProperty(name, value);
	}
	document.body.append(element);
	return element;
}

describe('readControlHeight', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it('берёт --s-kit-control-height', () => {
		expect(readControlHeight(makeElement({ '--s-kit-control-height': '40px' }))).toBe(40);
	});

	it('без него берёт --s-kit-control-height-md', () => {
		expect(readControlHeight(makeElement({ '--s-kit-control-height-md': '36px' }))).toBe(36);
	});

	it('--s-kit-control-height важнее -md', () => {
		expect(readControlHeight(makeElement({ '--s-kit-control-height': '28px', '--s-kit-control-height-md': '36px' }))).toBe(28);
	});

	it('без токенов или с мусором в значении: 32', () => {
		expect(readControlHeight(makeElement({}))).toBe(32);
		expect(readControlHeight(makeElement({ '--s-kit-control-height': 'auto' }))).toBe(32);
	});

	it('наследует значение от предка', () => {
		const parent = makeElement({ '--s-kit-control-height': '40px' });
		const child = document.createElement('div');
		parent.append(child);
		expect(readControlHeight(child)).toBe(40);
	});
});
