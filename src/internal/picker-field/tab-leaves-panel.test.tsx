import { afterEach, describe, expect, it } from 'vitest';

import { tabLeavesPanel } from './tab-leaves-panel';

afterEach(() => {
	document.body.innerHTML = '';
});

function build(html: string): HTMLElement {
	const panel = document.createElement('div');
	panel.innerHTML = html;
	document.body.append(panel);
	return panel;
}

function byId(panel: HTMLElement, id: string): HTMLElement {
	const element = panel.querySelector<HTMLElement>(`#${id}`);
	if (!element) {
		throw new Error(`Нет элемента #${id}`);
	}
	return element;
}

describe('tabLeavesPanel', () => {
	it('вперёд: выходит только с последнего tabbable-элемента', () => {
		const panel = build('<button id="a"></button><button id="b"></button>');
		expect(tabLeavesPanel(panel, byId(panel, 'a'), false)).toBe(false);
		expect(tabLeavesPanel(panel, byId(panel, 'b'), false)).toBe(true);
	});

	it('назад: выходит только с первого tabbable-элемента', () => {
		const panel = build('<button id="a"></button><button id="b"></button>');
		expect(tabLeavesPanel(panel, byId(panel, 'a'), true)).toBe(true);
		expect(tabLeavesPanel(panel, byId(panel, 'b'), true)).toBe(false);
	});

	it('отключённые, скрытые и tabindex -1 элементы не считаются', () => {
		const panel = build(
			'<button id="a"></button><button disabled></button><button hidden></button><button tabindex="-1" id="skip"></button>'
		);
		expect(tabLeavesPanel(panel, byId(panel, 'a'), false)).toBe(true);
		expect(tabLeavesPanel(panel, byId(panel, 'skip'), false)).toBe(true);
		expect(tabLeavesPanel(panel, byId(panel, 'skip'), true)).toBe(false);
	});

	it('сама панель с tabindex -1: вперёд Tab входит в неё, назад выходит', () => {
		const panel = build('<button id="a"></button>');
		panel.tabIndex = -1;
		expect(tabLeavesPanel(panel, panel, false)).toBe(false);
		expect(tabLeavesPanel(panel, panel, true)).toBe(true);
	});

	it('без tabbable-элементов и без цели выходит всегда', () => {
		const panel = build('<span id="a"></span>');
		expect(tabLeavesPanel(panel, byId(panel, 'a'), false)).toBe(true);
		expect(tabLeavesPanel(panel, null, false)).toBe(true);
	});
});
