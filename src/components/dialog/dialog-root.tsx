import { createSignal, createUniqueId, type JSX } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { DialogContext, type DialogContextValue } from './dialog-context';

export interface DialogRootProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** По умолчанию `true`. */
	closeOnEscape?: boolean | undefined;
	/** По умолчанию `true`; диалогам с несохранёнными данными нужен `false`. */
	closeOnBackdropClick?: boolean | undefined;
	children?: JSX.Element;
}

export function DialogRoot(props: DialogRootProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'Dialog',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [titleId, setTitleId] = createSignal<string>();
	const [descriptionId, setDescriptionId] = createSignal<string>();

	const context: DialogContextValue = {
		open,
		setOpen,
		contentId: `${createUniqueId()}-dialog`,
		anchor,
		setAnchor: (element) => {
			setAnchor(element);
		},
		closeOnEscape: () => props.closeOnEscape ?? true,
		closeOnBackdropClick: () => props.closeOnBackdropClick ?? true,
		titleId,
		setTitleId: (id) => {
			setTitleId(id);
		},
		descriptionId,
		setDescriptionId: (id) => {
			setDescriptionId(id);
		}
	};

	return <DialogContext.Provider value={context}>{props.children}</DialogContext.Provider>;
}
