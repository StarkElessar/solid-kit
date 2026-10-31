import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';

/** Неопределённая полоса прогресса под шапкой на время загрузки. */
export function GridProgress(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.loading()}>
			<div role='progressbar' aria-label={grid.loadingLabel()} class={styles['progress']}>
				<span class={styles['progress-bar']}/>
			</div>
		</Show>
	);
}
