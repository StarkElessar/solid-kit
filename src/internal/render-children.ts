import { type JSX, untrack } from 'solid-js';

/**
 * Контракт функции-ребёнка (зонтичный, раздел 11.1): функция с параметром получает состояние и вызывается один раз через `untrack`;
 * функцию без параметров Solid разворачивает сам как обычного ребёнка.
 */
export function renderChildren<State>(children: JSX.Element | ((state: State) => JSX.Element), state: State): JSX.Element {
	if (typeof children === 'function' && children.length > 0) {
		return untrack(() => children(state));
	}
	return children as JSX.Element;
}
