import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';

/** «Призрак» перетаскиваемой колонки: следует за указателем, событий не принимает. */
export function GridDragGhost(): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.drag()}>
			{(drag) => (
				<div
					aria-hidden='true'
					class={styles['ghost']}
					style={{ 'inset-inline-start': `${drag().x + 12}px`, 'inset-block-start': `${drag().y + 12}px` }}
				>
					{drag().title}
				</div>
			)}
		</Show>
	);
}
