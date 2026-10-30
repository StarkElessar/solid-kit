import { PopoverContent } from './popover-content';
import { PopoverRoot } from './popover-root';
import { PopoverTrigger } from './popover-trigger';

export type { PopoverContentProps } from './popover-content';
export type { PopoverRootProps } from './popover-root';
export type { PopoverState } from './popover-state';
export type { PopoverTriggerAttributes, PopoverTriggerProps } from './popover-trigger';
export { usePopover } from './use-popover';

export const Popover = { Root: PopoverRoot, Trigger: PopoverTrigger, Content: PopoverContent };
