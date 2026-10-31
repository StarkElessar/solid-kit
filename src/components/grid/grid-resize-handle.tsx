import styles from './grid.module.css';

import type { JSX } from 'solid-js';

import { useGrid } from './grid-context';

export interface GridResizeHandleProps {
	/** Индекс среди видимых колонок. */
	index: number;
	columnId: string;
}

/** Ручка на правом краю заголовка. В Tab-порядок не входит: клавиатурного ресайза в 4а нет. */
export function GridResizeHandle(props: GridResizeHandleProps): JSX.Element {
	const grid = useGrid();
	return (
		<span
			role='separator'
			aria-orientation='vertical'
			data-grid-resize
			data-disabled={grid.loading() ? '' : undefined}
			class={styles['resize-handle']}
			onPointerDown={(event) => {
				if (!grid.loading()) {
					grid.beginResize(props.index, event);
				}
			}}
			onDblClick={() => {
				if (!grid.loading()) {
					grid.resetWidth(props.columnId);
				}
			}}
		/>
	);
}
