import { type Accessor, createContext, useContext } from 'solid-js';

export interface DialogContextValue {
	open: Accessor<boolean>;
	setOpen: (open: boolean) => void;
	/** Идентификатор `<dialog>`: инициатор ссылается на него через `aria-controls`. */
	contentId: string;
	/** Инициатор: хост диалога, возврат фокуса. */
	anchor: Accessor<HTMLElement | undefined>;
	setAnchor: (element: HTMLElement | undefined) => void;
	closeOnEscape: Accessor<boolean>;
	closeOnBackdropClick: Accessor<boolean>;
	/** Идентификаторы смонтированных Title и Description: из них строятся `aria-labelledby` и `aria-describedby`. */
	titleId: Accessor<string | undefined>;
	setTitleId: (id: string | undefined) => void;
	descriptionId: Accessor<string | undefined>;
	setDescriptionId: (id: string | undefined) => void;
}

export const DialogContext = createContext<DialogContextValue>();

export function useDialogContext(part: string): DialogContextValue {
	const context = useContext(DialogContext);
	if (!context) {
		throw new Error(`${part} must be used inside Dialog.Root`);
	}
	return context;
}
