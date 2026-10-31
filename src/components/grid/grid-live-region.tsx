import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { useGrid } from './grid-context';

/** Скрытая область объявления результата: сосед корня, потому что корень получает `aria-busy` на время загрузки. */
export function GridLiveRegion(): JSX.Element {
	const grid = useGrid();
	return (
		<div aria-live='polite' aria-atomic='true' class={styles['visually-hidden']}>
			{grid.liveMessage()}
		</div>
	);
}
