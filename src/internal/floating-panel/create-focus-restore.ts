import { type Accessor, createEffect, onCleanup } from 'solid-js';

export interface FocusRestoreOptions {
	panel: Accessor<HTMLElement | undefined>;
	anchor: Accessor<Element | undefined>;
	open: Accessor<boolean>;
}

/**
 * Возвращает фокус на инициатор при закрытии панели, если фокус потерян (активен body: панель удалена из DOM)
 * или всё ещё внутри панели. Если клик снаружи уже перевёл фокус на другой элемент, фокус не перехватывается.
 */
export function createFocusRestore(options: FocusRestoreOptions): void {
	createEffect(() => {
		if (!options.open()) {
			return;
		}
		onCleanup(() => {
			const anchor = options.anchor();
			const active = document.activeElement;
			const lost = !active || active === document.body || (options.panel()?.contains(active) ?? false);
			if (lost && anchor instanceof HTMLElement && anchor.isConnected) {
				anchor.focus({ preventScroll: true });
			}
		});
	});
}
