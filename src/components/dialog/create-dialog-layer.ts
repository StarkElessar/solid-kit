import { type Accessor, createEffect, onCleanup, untrack } from 'solid-js';

import { registerLayer } from '../../utils/layer-stack';

export interface DialogLayerOptions {
	dialog: Accessor<HTMLDialogElement | undefined>;
	open: Accessor<boolean>;
	/** Запрос закрытия от стека слоёв (Esc, когда диалог верхний слой). */
	onEscape: () => void;
}

/**
 * Показ диалога как модального (`showModal()`) и участие в стеке слоёв с `modal: true`: стек его по клику снаружи не закрывает,
 * а Esc перехватывает в фазе захвата раньше нативной отмены (раздел 5 спека этапа 2). При размонтировании закрывает элемент,
 * если он ещё открыт: DOM-диалог и состояние не расходятся.
 */
export function createDialogLayer(options: DialogLayerOptions): void {
	createEffect(() => {
		const dialog = options.dialog();
		if (!options.open() || !dialog) {
			return;
		}
		if (!dialog.open) {
			dialog.showModal();
		}
		const unregister = registerLayer({
			contains: (target) => dialog.contains(target),
			close: () => {
				untrack(options.onEscape);
			},
			modal: true
		});
		onCleanup(() => {
			unregister();
			if (dialog.open) {
				dialog.close();
			}
		});
	});
}
