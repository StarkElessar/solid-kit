import { type Accessor, createEffect, untrack } from 'solid-js';

import { focusInitial, type InitialFocus } from './focus-initial';

export interface FocusOnOpenOptions {
	panel: Accessor<HTMLElement | undefined>;
	open: Accessor<boolean>;
	mode: Accessor<InitialFocus>;
}

/** Переносит фокус в панель после показа. Создавать после createPanelLayer: до showPopover() панель скрыта и не фокусируется. */
export function createFocusOnOpen(options: FocusOnOpenOptions): void {
	createEffect(() => {
		const panel = options.panel();
		if (!options.open() || !panel) {
			return;
		}
		focusInitial(panel, untrack(options.mode));
	});
}
