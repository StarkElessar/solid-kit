import { afterEach, describe, expect, it } from 'vitest';

import { blocksImplicitSubmit } from './blocks-implicit-submit';

function key(target: Element, name: string): KeyboardEvent {
	const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
	Object.defineProperty(event, 'target', { value: target });
	return event;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe('blocksImplicitSubmit', () => {
	it('blocks Enter in an input whose form lies outside the panel', () => {
		const form = document.createElement('form');
		const panel = document.createElement('div');
		const input = document.createElement('input');
		panel.append(input);
		form.append(panel);
		document.body.append(form);
		expect(blocksImplicitSubmit(key(input, 'Enter'), panel)).toBe(true);
	});

	it('does not block when the form is inside the panel, when there is no form, or for other keys and targets', () => {
		const panel = document.createElement('div');
		const form = document.createElement('form');
		const innerInput = document.createElement('input');
		form.append(innerInput);
		panel.append(form);
		document.body.append(panel);
		expect(blocksImplicitSubmit(key(innerInput, 'Enter'), panel)).toBe(false);

		const loose = document.createElement('input');
		const loosePanel = document.createElement('div');
		loosePanel.append(loose);
		document.body.append(loosePanel);
		expect(blocksImplicitSubmit(key(loose, 'Enter'), loosePanel)).toBe(false);

		const outerForm = document.createElement('form');
		const area = document.createElement('textarea');
		const wrapper = document.createElement('div');
		wrapper.append(area);
		outerForm.append(wrapper);
		document.body.append(outerForm);
		expect(blocksImplicitSubmit(key(area, 'Enter'), wrapper)).toBe(false);
		expect(blocksImplicitSubmit(key(innerInput, 'a'), panel)).toBe(false);
	});
});
