import { type Accessor, createEffect, untrack } from 'solid-js';

import { focusInitial, type InitialFocusMode } from './focus-initial';

export interface FocusOnOpenOptions {
	panel: Accessor<HTMLElement | undefined>;
	open: Accessor<boolean>;
	mode: Accessor<InitialFocusMode>;
}

/** Переносит фокус в панель после показа. Создавать после createPanelLayer: до showPopover() панель скрыта и не фокусируется. */
export function createFocusOnOpen(options: FocusOnOpenOptions): void {
	createEffect(() => {
		const panel = options.panel();
		if (!options.open() || !panel) {
			return;
		}
		const mode = untrack(options.mode);
		if (typeof mode === 'function') {
			mode(panel);
			return;
		}
		focusInitial(panel, mode);
	});
}
