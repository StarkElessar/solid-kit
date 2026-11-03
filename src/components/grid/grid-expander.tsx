import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { GridChevron } from './grid-chevron';

export interface GridExpanderProps {
	expanded: boolean;
	label: string;
	onToggle: () => void;
}

/** Кнопка раскрытия 20 px с шевроном. Строка тела игнорирует клики по интерактивным целям, поэтому сама на такой клик не реагирует. */
export function GridExpander(props: GridExpanderProps): JSX.Element {
	return (
		<button
			type='button'
			class={styles['expander']}
			aria-expanded={props.expanded}
			aria-label={props.label}
			onClick={() => {
				props.onToggle();
			}}
		>
			<GridChevron expanded={props.expanded}/>
		</button>
	);
}
