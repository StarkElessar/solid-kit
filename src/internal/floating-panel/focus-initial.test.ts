import { afterEach, describe, expect, it } from 'vitest';

import { focusInitial } from './focus-initial';

function build(html: string): HTMLElement {
	const panel = document.createElement('div');
	panel.innerHTML = html;
	document.body.append(panel);
	return panel;
}

afterEach(() => {
	document.body.replaceChildren();
});

describe('focusInitial', () => {
	it('focuses the first tabbable element and skips disabled, hidden and tabindex=-1 ones', () => {
		const panel = build(
			[
				'<button disabled id="a"></button><button tabindex="-1" id="b"></button>',
				'<div hidden><button id="c"></button></div><input id="d"/><button id="e"></button>'
			].join('')
		);
		focusInitial(panel, 'first');
		expect(document.activeElement?.id).toBe('d');
	});

	it('keeps looking when an element does not accept the focus (hidden by CSS), and falls back to the panel', () => {
		const panel = build('<button id="a"></button><button id="b"></button>');
		const first = panel.querySelector<HTMLElement>('#a');
		if (first) {
			first.focus = (): void => {};
		}
		focusInitial(panel, 'first');
		expect(document.activeElement?.id).toBe('b');
		const lonely = build('<button id="c"></button>');
		const only = lonely.querySelector<HTMLElement>('#c');
		if (only) {
			only.focus = (): void => {};
		}
		focusInitial(lonely, 'first');
		expect(document.activeElement).toBe(lonely);
	});

	it('focuses the panel itself (making it focusable) when nothing inside is tabbable', () => {
		const panel = build('<span>text</span>');
		focusInitial(panel, 'first');
		expect(document.activeElement).toBe(panel);
		expect(panel.getAttribute('tabindex')).toBe('-1');
	});

	it('mode "panel" focuses the panel even when it has tabbable content', () => {
		const panel = build('<button id="a"></button>');
		focusInitial(panel, 'panel');
		expect(document.activeElement).toBe(panel);
	});

	it('mode "none" leaves the focus alone', () => {
		const panel = build('<button id="a"></button>');
		const before = document.activeElement;
		focusInitial(panel, 'none');
		expect(document.activeElement).toBe(before);
	});
});
