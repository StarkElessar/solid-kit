import { type Accessor, createContext, useContext } from 'solid-js';

import type { ActiveSource, ListBoxController } from '../../internal/list-box/create-list-box-controller';
import type { ListRow } from '../../internal/list-box/list-row';
import type { RenderWindow } from '../../utils/render-window';

export type SelectSize = 'sm' | 'md' | 'lg';

/** Значения здесь стёрты до `unknown`: контекст не знает `T`, типизированные границы стоят в `Trigger` и `Content`. */
export interface SelectContextValue {
	listId: string;
	open: Accessor<boolean>;
	/** `source` решает, рисуется ли кольцо фокуса на активной опции: клавиатурное открытие показывает, мышиное нет. */
	setOpen: (open: boolean, source?: ActiveSource) => void;
	anchor: Accessor<HTMLElement | undefined>;
	setAnchor: (element: HTMLElement | undefined) => void;
	value: Accessor<unknown>;
	getLabel: (item: unknown) => string;
	rows: Accessor<readonly ListRow<unknown>[]>;
	controller: ListBoxController;
	window: RenderWindow;
	setScroller: (element: HTMLElement | undefined) => void;
	loading: Accessor<boolean>;
	disabled: Accessor<boolean>;
	size: Accessor<SelectSize | undefined>;
}

export const SelectContext = createContext<SelectContextValue>();

export function useSelectContext(part: string): SelectContextValue {
	const context = useContext(SelectContext);
	if (!context) {
		throw new Error(`${part} must be used inside Select.Root`);
	}
	return context;
}
