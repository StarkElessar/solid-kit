import { type Accessor, createContext, useContext } from 'solid-js';

import type { MenuOpenSource } from './context-menu-context';

export interface SubContextValue {
	open: Accessor<boolean>;
	/** Чем открыто: с клавиатуры фокус уходит на первый пункт подменю, мышью остаётся на `SubTrigger`. */
	source: Accessor<MenuOpenSource>;
	setOpen: (open: boolean, source?: MenuOpenSource) => void;
	trigger: Accessor<HTMLElement | undefined>;
	setTrigger: (element: HTMLElement | undefined) => void;
	triggerId: string;
	contentId: string;
}

export const SubContext = createContext<SubContextValue>();

export function useSubContext(part: string): SubContextValue {
	const context = useContext(SubContext);
	if (!context) {
		throw new Error(`${part} must be used inside ContextMenu.Sub`);
	}
	return context;
}
