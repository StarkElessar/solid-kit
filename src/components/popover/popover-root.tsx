import type { Placement } from '@floating-ui/dom';
import { createSignal, createUniqueId, type JSX } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { PopoverContext, type PopoverContextValue } from './popover-context';

export interface PopoverRootProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** По умолчанию `bottom-start`. */
	placement?: Placement | undefined;
	/** Зазор между инициатором и панелью, по умолчанию 4. */
	gap?: number | undefined;
	children?: JSX.Element;
}

export function PopoverRoot(props: PopoverRootProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'Popover',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [anchor, setAnchor] = createSignal<HTMLElement>();

	const context: PopoverContextValue = {
		open,
		setOpen,
		contentId: `${createUniqueId()}-popover`,
		anchor,
		setAnchor: (element) => {
			setAnchor(element);
		},
		placement: () => props.placement,
		gap: () => props.gap
	};

	return <PopoverContext.Provider value={context}>{props.children}</PopoverContext.Provider>;
}
