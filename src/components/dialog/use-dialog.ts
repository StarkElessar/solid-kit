import { useDialogContext } from './dialog-context';
import type { DialogState } from './dialog-state';

/** Состояние ближайшего `Dialog.Root`: для кнопок и разметки внутри содержимого. */
export function useDialog(): DialogState {
	const context = useDialogContext('useDialog');
	return {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};
}
