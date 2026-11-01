import styles from './grid.module.css';

import type { JSX } from 'solid-js';

export interface GridToolbarButtonProps {
	label: string;
	disabled: boolean;
	onClick: () => void;
	/** Содержимое иконки: `svg` 16 px, `currentColor`. */
	children: JSX.Element;
}

/** Иконочная кнопка верхней полосы грида. */
export function GridToolbarButton(props: GridToolbarButtonProps): JSX.Element {
	return (
		<button
			type='button'
			class={styles['toolbar-button']}
			aria-label={props.label}
			title={props.label}
			disabled={props.disabled}
			onClick={() => {
				props.onClick();
			}}
		>
			{props.children}
		</button>
	);
}
