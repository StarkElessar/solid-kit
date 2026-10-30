import { DialogContent } from './dialog-content';
import { DialogRoot } from './dialog-root';
import { DialogTrigger } from './dialog-trigger';

export type { DialogContentProps } from './dialog-content';
export type { DialogRootProps } from './dialog-root';
export type { DialogState } from './dialog-state';
export type { DialogTriggerAttributes, DialogTriggerProps } from './dialog-trigger';
export { useDialog } from './use-dialog';

export const Dialog = { Root: DialogRoot, Trigger: DialogTrigger, Content: DialogContent };
