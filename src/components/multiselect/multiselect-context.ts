import { type Accessor, createContext, type JSX, useContext } from 'solid-js';

import type { ActiveSource, ListBoxController } from '../../internal/list-box/create-list-box-controller';
import type { ListKey, ListRow } from '../../internal/list-box/list-row';
import type { RenderWindow } from '../../utils/render-window';

export type MultiSelectSize = 'sm' | 'md' | 'lg';
export type ChipsOverflow = 'collapse' | 'wrap' | 'summary';

/** Значения здесь стёрты до `unknown`: контекст не знает `T`, типизированные границы стоят в `Trigger` и `Content`. */
export interface MultiSelectContextValue {
	listId: string;
	open: Accessor<boolean>;
	/** `source` решает, рисуется ли кольцо фокуса на активной опции: клавиатурное открытие показывает, мышиное нет. */
	setOpen: (open: boolean, source?: ActiveSource) => void;
	/** Оболочка триггера: якорь панели. */
	anchor: Accessor<HTMLElement | undefined>;
	setAnchor: (element: HTMLElement | undefined) => void;
	/** Поле ввода `combobox` в оболочке: владелец списка, фокус всегда в нём. */
	input: Accessor<HTMLInputElement | undefined>;
	setInput: (element: HTMLInputElement | undefined) => void;
	isAll: Accessor<boolean>;
	/** Выбранные элементы (в состоянии «Все» пусто). */
	selectedItems: Accessor<readonly unknown[]>;
	/** Число выбранных: в состоянии «Все» равно `total`. */
	count: Accessor<number>;
	total: Accessor<number>;
	getKey: (item: unknown) => ListKey;
	getLabel: (item: unknown) => string;
	removeItem: (item: unknown) => void;
	clearAll: () => void;
	allLabel: Accessor<JSX.Element>;
	chipsOverflow: Accessor<ChipsOverflow>;
	searchable: Accessor<boolean>;
	query: Accessor<string>;
	/** Пользователь печатает: запрос меняется, список открывается и подсвечивает первую доступную опцию. */
	handleInput: (text: string) => void;
	rows: Accessor<readonly ListRow<unknown>[]>;
	controller: ListBoxController;
	window: RenderWindow;
	setScroller: (element: HTMLElement | undefined) => void;
	loading: Accessor<boolean>;
	disabled: Accessor<boolean>;
	size: Accessor<MultiSelectSize | undefined>;
}

export const MultiSelectContext = createContext<MultiSelectContextValue>();

export function useMultiSelectContext(part: string): MultiSelectContextValue {
	const context = useContext(MultiSelectContext);
	if (!context) {
		throw new Error(`${part} must be used inside MultiSelect.Root`);
	}
	return context;
}
