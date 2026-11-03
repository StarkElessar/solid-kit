import styles from './time-columns.module.css';

import type { JSX } from 'solid-js';

export interface TimeOptionProps {
	id: number;
	label: string;
	selected: boolean;
	highlighted: boolean;
	disabled: boolean;
	/** Единственная строка колонки в порядке Tab (roving tabindex). */
	focusable: boolean;
	/** Куда оболочка переносит фокус при открытии стрелкой. */
	focusTarget: boolean;
	onPick: (id: number) => void;
}

export function TimeOption(props: TimeOptionProps): JSX.Element {
	return (
		<button
			type='button'
			role='option'
			class={styles['option']}
			tabindex={props.focusable ? 0 : -1}
			aria-selected={props.selected}
			aria-disabled={props.disabled ? 'true' : undefined}
			data-id={props.id}
			data-selected={props.selected ? '' : undefined}
			data-highlighted={props.highlighted ? '' : undefined}
			data-focus-target={props.focusTarget ? '' : undefined}
			onClick={() => {
				props.onPick(props.id);
			}}
		>
			{props.label}
		</button>
	);
}
