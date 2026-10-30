import { type Accessor, createContext, useContext } from 'solid-js';

import type { ContextMenuPoint } from './context-menu-point';

/** Чем открыто меню: от этого зависит, куда уходит фокус (при открытии мышью на меню, с клавиатуры на первый пункт). */
export type MenuOpenSource = 'pointer' | 'keyboard';

export interface ContextMenuContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	/** Открывает меню в точке; `source` решает, куда уйдёт фокус. */
	openAt: (point: ContextMenuPoint, source: MenuOpenSource) => void;
	point: Accessor<ContextMenuPoint | undefined>;
	source: Accessor<MenuOpenSource>;
	/** Область вызова: от неё считается хост панели, она же запасной получатель фокуса. */
	area: Accessor<HTMLElement | undefined>;
	setArea: (element: HTMLElement | undefined) => void;
	/** Элемент, державший фокус до открытия: ему вернётся фокус при закрытии. */
	opener: Accessor<Element | undefined>;
}

export const ContextMenuContext = createContext<ContextMenuContextValue>();

export function useContextMenuContext(part: string): ContextMenuContextValue {
	const context = useContext(ContextMenuContext);
	if (!context) {
		throw new Error(`${part} must be used inside ContextMenu.Root`);
	}
	return context;
}
