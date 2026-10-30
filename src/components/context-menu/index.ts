import { ContextMenuContent } from './context-menu-content';
import { ContextMenuItem } from './context-menu-item';
import { ContextMenuRoot } from './context-menu-root';
import { ContextMenuSeparator } from './context-menu-separator';
import { ContextMenuSub } from './context-menu-sub';
import { ContextMenuSubContent } from './context-menu-sub-content';
import { ContextMenuSubTrigger } from './context-menu-sub-trigger';
import { ContextMenuTrigger } from './context-menu-trigger';

export type { ContextMenuContentProps } from './context-menu-content';
export type { ContextMenuItemProps } from './context-menu-item';
export type { ContextMenuPoint } from './context-menu-point';
export type { ContextMenuRootProps } from './context-menu-root';
export type { ContextMenuSeparatorProps } from './context-menu-separator';
export type { ContextMenuSubProps } from './context-menu-sub';
export type { ContextMenuSubContentProps } from './context-menu-sub-content';
export type { ContextMenuSubTriggerProps } from './context-menu-sub-trigger';
export type { ContextMenuTriggerProps } from './context-menu-trigger';

export const ContextMenu = {
	Root: ContextMenuRoot,
	Trigger: ContextMenuTrigger,
	Content: ContextMenuContent,
	Item: ContextMenuItem,
	Separator: ContextMenuSeparator,
	Sub: ContextMenuSub,
	SubTrigger: ContextMenuSubTrigger,
	SubContent: ContextMenuSubContent
};
