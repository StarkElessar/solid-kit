import type { JSX } from 'solid-js';

/** События, которые корень панели изолирует делегированными обработчиками Solid (спек этапа 2, раздел 3.3). */
export type IsolatedEventProp =
	| 'onClick'
	| 'onDblClick'
	| 'onContextMenu'
	| 'onPointerDown'
	| 'onMouseDown'
	| 'onKeyUp'
	| 'onInput'
	| 'onFocusIn'
	| 'onFocusOut';

function stop(event: Event): void {
	event.stopPropagation();
}

/**
 * Делегированные обработчики Solid (не нативные): обработчики внутри панели срабатывают раньше, а обработчики логических предков нет.
 * Нативный stopPropagation на корне запрещён: он лишил бы событие пути до слушателя Solid на document (зонтичный, раздел 8.3).
 */
export const isolationHandlers: Pick<JSX.HTMLAttributes<HTMLDivElement>, IsolatedEventProp> = {
	onClick: stop,
	onDblClick: stop,
	onContextMenu: stop,
	onPointerDown: stop,
	onMouseDown: stop,
	onKeyUp: stop,
	onInput: stop,
	onFocusIn: stop,
	onFocusOut: stop
};
