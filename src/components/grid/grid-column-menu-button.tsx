import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';

export interface GridColumnMenuButtonProps {
	columnId: string;
	title: string;
}

/** Кнопка меню колонки в ячейке шапки: три вертикальные точки. Открывает общее меню грида для своей колонки. */
export function GridColumnMenuButton(props: GridColumnMenuButtonProps): JSX.Element {
	const grid = useGrid();
	return (
		<Show when={grid.hasColumnMenu()}>
			<button
				type='button'
				class={styles['menu-button']}
				aria-haspopup='menu'
				aria-expanded={grid.columnMenu()?.columnId === props.columnId}
				aria-label={grid.columnMenuLabels().button(props.title)}
				disabled={grid.loading()}
				data-grid-column-menu={props.columnId}
				onClick={(event) => {
					// detail 0 у клика, вызванного клавиатурой (Enter, Space): тогда фокус уходит на первый пункт
					grid.toggleColumnMenu(props.columnId, event.currentTarget, event.detail === 0 ? 'keyboard' : 'pointer');
				}}
			>
				<svg viewBox='0 0 16 16' aria-hidden='true'>
					<circle cx='8' cy='3.5' r='1.4' fill='currentColor'/>
					<circle cx='8' cy='8' r='1.4' fill='currentColor'/>
					<circle cx='8' cy='12.5' r='1.4' fill='currentColor'/>
				</svg>
			</button>
		</Show>
	);
}
