const TABBABLE = [
	'a[href]',
	'button',
	'input:not([type="hidden"])',
	'select',
	'textarea',
	'summary',
	'[tabindex]',
	'[contenteditable=""]',
	'[contenteditable="true"]'
].join(', ');

function isTabbable(element: HTMLElement): boolean {
	if (element.tabIndex < 0 || element.matches(':disabled')) {
		return false;
	}
	return element.closest('[hidden], [inert]') === null;
}

/** Элементы внутри `root`, до которых доходит Tab, в порядке документа. */
export function tabbableElements(root: HTMLElement): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(isTabbable);
}
