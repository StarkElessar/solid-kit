import { tabbableElements } from '../floating-panel/tabbable-elements';

/**
 * Выйдет ли Tab (или Shift+Tab) за край панели: от текущего элемента дальше по ходу нет ни одного tabbable-элемента.
 * Позиция считается по порядку документа, поэтому работает и когда фокус стоит на элементе вне списка (строка колонки, сама панель).
 */
export function tabLeavesPanel(panel: HTMLElement, from: EventTarget | null, backwards: boolean): boolean {
	if (!(from instanceof Node)) {
		return true;
	}
	return !tabbableElements(panel).some((candidate) => {
		if (candidate === from) {
			return false;
		}
		const position = from.compareDocumentPosition(candidate);
		// кандидат внутри самого элемента (панель с tabindex -1): Tab входит в неё вперёд
		if (position & Node.DOCUMENT_POSITION_CONTAINED_BY) {
			return !backwards;
		}
		return backwards ? Boolean(position & Node.DOCUMENT_POSITION_PRECEDING) : Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING);
	});
}
