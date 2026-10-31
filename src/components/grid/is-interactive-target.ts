/** Элементы, у которых есть собственное действие по клику: клик по ним строку не выбирает. */
const INTERACTIVE = [
	'button',
	'a[href]',
	'input',
	'select',
	'textarea',
	'summary',
	'label',
	'[role="button"]',
	'[role="combobox"]',
	'[role="menuitem"]',
	'[role="option"]',
	'[contenteditable]',
	'[data-grid-no-select]'
].join(', ');

/**
 * Относится ли цель клика к интерактивному элементу внутри строки: тогда клик не переключает выбор строки (раздел 7 спека). Цель вне
 * строки (панель, смонтированная в корень грида, но получившая событие через дерево Solid) и `null` тоже считаются интерактивными:
 * чужое поддерево строку выбирать не должно.
 */
export function isInteractiveTarget(target: EventTarget | null, row: Element): boolean {
	if (target === null) {
		return true;
	}
	const start = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
	if (start === null || !row.contains(start)) {
		return true;
	}
	for (let element: Element | null = start; element !== null && element !== row; element = element.parentElement) {
		if (element.matches(INTERACTIVE)) {
			return true;
		}
	}
	return false;
}
