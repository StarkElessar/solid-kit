import { type Accessor, createEffect, onCleanup, untrack } from 'solid-js';

import { registerLayer } from './layer-stack';

export interface PanelLayerOptions {
	open: Accessor<boolean>;
	panel: Accessor<HTMLElement | undefined>;
	/** Инициатор: pointerdown по нему не считается кликом снаружи. */
	anchor: Accessor<Element | undefined>;
	onDismiss: () => void;
}

function hidePanel(panel: HTMLElement): void {
	if (!panel.isConnected) {
		return;
	}
	try {
		panel.hidePopover();
	}
	catch {
		// браузер уже скрыл панель сам: повторное скрытие бросает InvalidStateError
	}
}

/**
 * Показ плавающей панели в top layer (Popover API, режим manual) и участие в стеке слоёв.
 * Закрытием управляет стек, а не браузер, поэтому `popover="manual"` (раздел 8 спека).
 */
export function createPanelLayer(options: PanelLayerOptions): void {
	createEffect(() => {
		const panel = options.panel();
		if (!options.open() || !panel) {
			return;
		}
		panel.setAttribute('popover', 'manual');
		panel.showPopover();
		const unregister = registerLayer({
			contains: (target) => panel.contains(target) || (options.anchor()?.contains(target) ?? false),
			close: () => {
				untrack(options.onDismiss);
			}
		});
		onCleanup(() => {
			unregister();
			hidePanel(panel);
		});
	});
}
