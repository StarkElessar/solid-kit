import { DialogBody } from './dialog-body';
import { DialogClose } from './dialog-close';
import { DialogContent } from './dialog-content';
import { DialogDescription } from './dialog-description';
import { DialogFooter } from './dialog-footer';
import { DialogRoot } from './dialog-root';
import { DialogTitle } from './dialog-title';
import { DialogTrigger } from './dialog-trigger';

export type { DialogBodyProps } from './dialog-body';
export type { DialogCloseProps } from './dialog-close';
export type { DialogContentProps } from './dialog-content';
export type { DialogDescriptionProps } from './dialog-description';
export type { DialogFooterProps } from './dialog-footer';
export type { DialogRootProps } from './dialog-root';
export type { DialogState } from './dialog-state';
export type { DialogTitleProps } from './dialog-title';
export type { DialogTriggerAttributes, DialogTriggerProps } from './dialog-trigger';
export { useDialog } from './use-dialog';

export const Dialog = {
	Root: DialogRoot,
	Trigger: DialogTrigger,
	Content: DialogContent,
	Title: DialogTitle,
	Description: DialogDescription,
	Body: DialogBody,
	Footer: DialogFooter,
	Close: DialogClose
};
