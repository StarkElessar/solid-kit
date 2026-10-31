import { type Accessor, createContext, useContext } from 'solid-js';

import type { ActiveSource, ListBoxController } from '../../internal/list-box/create-list-box-controller';
import type { ListRow } from '../../internal/list-box/list-row';
import type { RenderWindow } from '../../utils/render-window';

export type ComboboxSize = 'sm' | 'md' | 'lg';

/** Значения здесь стёрты до `unknown`: контекст не знает `T`, типизированные границы стоят в `Content`. */
export interface ComboboxContextValue {
	listId: string;
	open: Accessor<boolean>;
	/** `source` решает, рисуется ли кольцо фокуса на активной опции: клавиатурное открытие показывает, мышиное нет. */
	setOpen: (open: boolean, source?: ActiveSource) => void;
	/** Оболочка поля: якорь панели. */
	anchor: Accessor<HTMLElement | undefined>;
	setAnchor: (element: HTMLElement | undefined) => void;
	input: Accessor<HTMLInputElement | undefined>;
	setInput: (element: HTMLInputElement | undefined) => void;
	query: Accessor<string>;
	/** Пользователь печатал: текст поля пришёл от него, а не из подписи значения. */
	handleInput: (text: string) => void;
	/** Фокус ушёл из поля: текст возвращается к подписи, пустой текст сбрасывает значение. */
	handleBlur: () => void;
	rows: Accessor<readonly ListRow<unknown>[]>;
	controller: ListBoxController;
	window: RenderWindow;
	setScroller: (element: HTMLElement | undefined) => void;
	loading: Accessor<boolean>;
	disabled: Accessor<boolean>;
	size: Accessor<ComboboxSize | undefined>;
}

export const ComboboxContext = createContext<ComboboxContextValue>();

export function useComboboxContext(part: string): ComboboxContextValue {
	const context = useContext(ComboboxContext);
	if (!context) {
		throw new Error(`${part} must be used inside Combobox.Root`);
	}
	return context;
}
