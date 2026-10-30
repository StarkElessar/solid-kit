import { type Accessor, createContext, useContext } from 'solid-js';

/** Общее для пунктов одного уровня меню (корня или подменю): закрыть всю цепочку и узнать, какой пункт в фокусе. */
export interface MenuLevelContextValue {
	/** Закрывает корневое меню, а с ним все подменю. */
	closeAll: () => void;
	activeItem: Accessor<HTMLElement | undefined>;
	setActiveItem: (item: HTMLElement | undefined) => void;
}

export const MenuLevelContext = createContext<MenuLevelContextValue>();

export function useMenuLevelContext(part: string): MenuLevelContextValue {
	const context = useContext(MenuLevelContext);
	if (!context) {
		throw new Error(`${part} must be used inside ContextMenu.Content`);
	}
	return context;
}
