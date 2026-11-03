import styles from './grid.module.css';

import type { JSX } from 'solid-js';

export interface GridChevronProps {
	expanded: boolean;
}

/** Шеврон раскрытия: вправо у свёрнутой строки, вниз у развёрнутой. Один на группы грида и узлы TreeList. */
export function GridChevron(props: GridChevronProps): JSX.Element {
	return (
		<svg aria-hidden='true' viewBox='0 0 16 16' class={styles['chevron']} data-expanded={props.expanded ? '' : undefined}>
			<path d='M6 4l4 4-4 4' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>
		</svg>
	);
}
