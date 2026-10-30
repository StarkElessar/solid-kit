import { afterEach, describe, expect, it } from 'vitest';

import { focusFirstItem, isItemDisabled, itemOf, menuItems, revealTruncatedTitle } from './menu-items';

afterEach(() => {
	document.body.innerHTML = '';
});

function build(html: string): HTMLElement {
	document.body.innerHTML = html;
	const panel = document.querySelector<HTMLElement>('[data-panel]');
	if (!panel) {
		throw new Error('panel is missing');
	}
	return panel;
}

describe('menuItems', () => {
	it('returns the items of this menu only, not the items of a submenu mounted inside its subtree', () => {
		const panel = build(`
			<div role="menu" data-panel>
				<div role="menuitem" id="a"></div>
				<div role="menu"><div role="menuitem" id="nested"></div></div>
				<div role="menuitem" id="b"></div>
			</div>`);
		expect(menuItems(panel).map((item) => item.id)).toEqual(['a', 'b']);
	});
});

describe('isItemDisabled and itemOf', () => {
	it('reads aria-disabled', () => {
		const panel = build('<div role="menu" data-panel><div role="menuitem" id="a" aria-disabled="true"></div></div>');
		expect(isItemDisabled(panel.querySelector<HTMLElement>('#a') as HTMLElement)).toBe(true);
	});

	it('finds the item of this menu for a target inside it and nothing for foreign targets', () => {
		const panel = build(`
			<div role="menu" data-panel>
				<div role="menuitem" id="a"><span id="label">x</span></div>
				<div role="menu"><div role="menuitem" id="nested"></div></div>
			</div>`);
		expect(itemOf(panel, panel.querySelector('#label'))?.id).toBe('a');
		expect(itemOf(panel, panel.querySelector('#nested'))).toBeUndefined();
		expect(itemOf(panel, panel)).toBeUndefined();
		expect(itemOf(panel, null)).toBeUndefined();
	});
});

describe('focusFirstItem', () => {
	it('focuses the first enabled item', () => {
		const panel = build(`
			<div role="menu" data-panel>
				<div role="menuitem" tabindex="-1" id="a" aria-disabled="true"></div>
				<div role="menuitem" tabindex="-1" id="b"></div>
			</div>`);
		focusFirstItem(panel);
		expect(document.activeElement?.id).toBe('b');
	});

	it('focuses the panel itself when there is no enabled item', () => {
		const panel = build('<div role="menu" data-panel></div>');
		focusFirstItem(panel);
		expect(document.activeElement).toBe(panel);
		expect(panel.getAttribute('tabindex')).toBe('-1');
	});
});

describe('revealTruncatedTitle', () => {
	function item(scrollWidth: number, clientWidth: number, title?: string): HTMLElement {
		const element = document.createElement('div');
		if (title) {
			element.setAttribute('title', title);
		}
		const label = document.createElement('span');
		label.setAttribute('data-s-kit-menu-label', '');
		label.textContent = 'Очень длинный пункт';
		Object.defineProperty(label, 'scrollWidth', { value: scrollWidth });
		Object.defineProperty(label, 'clientWidth', { value: clientWidth });
		element.append(label);
		return element;
	}

	it('sets the title from the text when the label is cut off', () => {
		const element = item(200, 100);
		revealTruncatedTitle(element);
		expect(element.getAttribute('title')).toBe('Очень длинный пункт');
	});

	it('leaves a fitting label and an own title alone', () => {
		const fitting = item(100, 100);
		revealTruncatedTitle(fitting);
		expect(fitting.hasAttribute('title')).toBe(false);
		const own = item(200, 100, 'свой');
		revealTruncatedTitle(own);
		expect(own.getAttribute('title')).toBe('свой');
	});
});
