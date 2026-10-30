const ITEM = '[role="menuitem"]';
const MENU = '[role="menu"]';

/**
 * Пункты именно этого меню. Панель подменю может оказаться в DOM-поддереве родительской панели (хост выбирается по якорю),
 * поэтому пункт принадлежит меню, только если оно его ближайшее.
 */
export function menuItems(panel: HTMLElement): HTMLElement[] {
	return Array.from(panel.querySelectorAll<HTMLElement>(ITEM)).filter((item) => item.closest(MENU) === panel);
}

export function isItemDisabled(item: HTMLElement): boolean {
	return item.getAttribute('aria-disabled') === 'true';
}

/** Пункт этого меню, внутри которого лежит цель события; `undefined`, если цель вне пунктов или в чужом меню. */
export function itemOf(panel: HTMLElement, target: EventTarget | null): HTMLElement | undefined {
	if (!(target instanceof Element)) {
		return undefined;
	}
	const item = target.closest<HTMLElement>(ITEM);
	return item && item.closest(MENU) === panel ? item : undefined;
}

/** Фокус на первый доступный пункт; если таких нет, на саму панель. */
export function focusFirstItem(panel: HTMLElement): void {
	const first = menuItems(panel).find((item) => !isItemDisabled(item));
	if (first) {
		first.focus({ preventScroll: true });
		return;
	}
	if (!panel.hasAttribute('tabindex')) {
		panel.setAttribute('tabindex', '-1');
	}
	panel.focus({ preventScroll: true });
}

/** Длинный пункт обрезан многоточием: текст целиком в `title` (свой `title` не перезаписывается). */
export function revealTruncatedTitle(item: HTMLElement): void {
	if (item.hasAttribute('title')) {
		return;
	}
	const label = item.querySelector<HTMLElement>(':scope > [data-s-kit-menu-label]');
	if (label && label.scrollWidth > label.clientWidth) {
		item.setAttribute('title', label.textContent);
	}
}
