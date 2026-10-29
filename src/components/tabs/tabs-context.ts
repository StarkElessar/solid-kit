import { createContext, useContext } from 'solid-js';

import type { TabEntry } from './tabs-entry';

export interface TabsContextValue {
	/** Основа идентификаторов вкладок и панелей этого `Tabs.Root`. */
	baseId: string;
	value: () => string | null;
	select: (value: string) => void;
	/** Значение вкладки в порядке Tab: выбранная доступная, иначе первая доступная. */
	tabbableValue: () => string | null;
	/** Регистрирует вкладку; возвращает функцию снятия с регистрации. */
	register: (entry: TabEntry) => () => void;
}

export const TabsContext = createContext<TabsContextValue>();

export function useTabsContext(part: string): TabsContextValue {
	const context = useContext(TabsContext);
	if (!context) {
		throw new Error(`${part} must be used inside Tabs.Root`);
	}
	return context;
}
