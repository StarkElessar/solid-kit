import type { VirtualElement } from '@floating-ui/dom';

import type { ContextMenuPoint } from './context-menu-point';

/** Виртуальный якорь нулевого размера в точке: Floating UI сам разворачивает меню через flip и shift у краёв вьюпорта. */
export function pointAnchor(point: ContextMenuPoint): VirtualElement {
	const rect = { x: point.x, y: point.y, width: 0, height: 0, top: point.y, right: point.x, bottom: point.y, left: point.x };
	return { getBoundingClientRect: () => rect };
}

/** Нижний левый угол элемента: точка открытия меню с клавиатуры. */
export function elementPoint(element: Element): ContextMenuPoint {
	const rect = element.getBoundingClientRect();
	return { x: rect.left, y: rect.bottom };
}
