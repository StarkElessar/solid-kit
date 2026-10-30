import type { Accessor } from 'solid-js';

export interface PopoverState {
	open: Accessor<boolean>;
	close: () => void;
}
