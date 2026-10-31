import styles from './grid.module.css';

import type { JSX } from 'solid-js';

const ARROW_PATH = {
	asc: 'M8 13V3M4 7l4-4 4 4',
	desc: 'M8 3v10M4 9l4 4 4-4',
	none: 'M5 6l3-3 3 3M5 10l3 3 3-3'
} as const;

export interface GridSortButtonProps {
	title: string;
	/** Направление активной сортировки; `undefined` у неактивной колонки. */
	direction: 'asc' | 'desc' | undefined;
	onClick: () => void;
}

/** Кнопка заголовка сортируемой колонки: стрелка слева от названия, у неактивной колонки приглушённая. */
export function GridSortButton(props: GridSortButtonProps): JSX.Element {
	return (
		<button
			type='button'
			class={styles['sort-button']}
			data-active={props.direction === undefined ? undefined : ''}
			onClick={() => {
				props.onClick();
			}}
		>
			<svg class={styles['sort-arrow']} viewBox='0 0 16 16' aria-hidden='true' data-direction={props.direction ?? 'none'}>
				<path
					d={ARROW_PATH[props.direction ?? 'none']}
					fill='none'
					stroke='currentColor'
					stroke-width='1.6'
					stroke-linecap='round'
					stroke-linejoin='round'
				/>
			</svg>
			<span class={styles['sort-title']}>{props.title}</span>
		</button>
	);
}
