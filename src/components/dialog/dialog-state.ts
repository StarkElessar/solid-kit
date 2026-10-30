import type { Accessor } from 'solid-js';

export interface DialogState {
	open: Accessor<boolean>;
	close: () => void;
}
