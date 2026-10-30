import { usePopoverContext } from './popover-context';
import type { PopoverState } from './popover-state';

/** Состояние ближайшего `Popover.Root`: для кнопок и разметки внутри содержимого. */
export function usePopover(): PopoverState {
	const context = usePopoverContext('usePopover');
	return {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};
}
