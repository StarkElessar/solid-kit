import type { Placement } from '@floating-ui/dom';
import { type Accessor, createContext, useContext } from 'solid-js';

export interface PopoverContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	/** Идентификатор панели: инициатор ссылается на него через `aria-controls`. */
	contentId: string;
	anchor: Accessor<HTMLElement | undefined>;
	setAnchor: (element: HTMLElement | undefined) => void;
	placement: Accessor<Placement | undefined>;
	gap: Accessor<number | undefined>;
}

export const PopoverContext = createContext<PopoverContextValue>();

export function usePopoverContext(part: string): PopoverContextValue {
	const context = useContext(PopoverContext);
	if (!context) {
		throw new Error(`${part} must be used inside Popover.Root`);
	}
	return context;
}
