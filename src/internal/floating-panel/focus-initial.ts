export type InitialFocus = 'first' | 'panel' | 'none';

/** Куда переносится фокус при открытии: готовый режим или своя функция (меню фокусирует пункт, а не первый табулируемый элемент). */
export type InitialFocusMode = InitialFocus | ((panel: HTMLElement) => void);

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

/**
 * Первый элемент панели, который реально принял фокус, а если такого нет, сама панель (ей ставится `tabindex="-1"`).
 * Элементы под `display: none` или `visibility: hidden` фокус не принимают: перебор идёт дальше, а не обрывается.
 * Прокрутка страницы не нужна.
 */
export function focusInitial(panel: HTMLElement, mode: InitialFocus): void {
	if (mode === 'none') {
		return;
	}
	if (mode === 'first') {
		for (const candidate of Array.from(panel.querySelectorAll<HTMLElement>(TABBABLE)).filter(isTabbable)) {
			candidate.focus({ preventScroll: true });
			if (document.activeElement === candidate) {
				return;
			}
		}
	}
	if (!panel.hasAttribute('tabindex')) {
		panel.setAttribute('tabindex', '-1');
	}
	panel.focus({ preventScroll: true });
}
