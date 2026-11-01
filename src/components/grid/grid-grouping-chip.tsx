import styles from './grid.module.css';

import { type JSX, onCleanup } from 'solid-js';

import { useGrid } from './grid-context';
import { placeGrouping } from './place-grouping';
import { removeGrouping } from './remove-grouping';
import { rescueFocus } from './rescue-focus';

export interface GridGroupingChipProps {
	/** Id колонки группировки. */
	columnId: string;
	title: string;
}

/** Чип группировки: название колонки (Alt+←/→ переставляют, Delete и Backspace убирают) и кнопка «×». */
export function GridGroupingChip(props: GridGroupingChipProps): JSX.Element {
	const grid = useGrid();
	let element: HTMLSpanElement | undefined;
	const index = (): number => grid.grouping().indexOf(props.columnId);
	// порядок чипов меняет DOM: фокус возвращается кнопке названия после перестановки
	const refocus = (id: string): void => {
		queueMicrotask(() => {
			const chips = element?.parentElement?.querySelectorAll<HTMLElement>('[data-chip]') ?? [];
			for (const chip of chips) {
				if (chip.dataset['chip'] === id) {
					chip.querySelector('button')?.focus();
				}
			}
		});
	};

	onCleanup(() => {
		if (element) {
			rescueFocus(element, grid.rootElement);
		}
	});

	return (
		<span ref={element} class={styles['chip']} data-chip={props.columnId}>
			<button
				type='button'
				class={styles['chip-main']}
				onKeyDown={(event) => {
					const list = grid.grouping();
					if (event.key === 'Delete' || event.key === 'Backspace') {
						event.preventDefault();
						grid.setGrouping(removeGrouping(list, props.columnId));
					}
					else if (event.altKey && event.key === 'ArrowLeft' && index() > 0) {
						event.preventDefault();
						grid.setGrouping(placeGrouping(list, props.columnId, index() - 1));
						refocus(props.columnId);
					}
					else if (event.altKey && event.key === 'ArrowRight' && index() < list.length - 1) {
						event.preventDefault();
						grid.setGrouping(placeGrouping(list, props.columnId, index() + 2));
						refocus(props.columnId);
					}
				}}
			>{props.title}</button>
			<button
				type='button'
				class={styles['chip-remove']}
				aria-label={grid.groupingLabels().remove(props.title)}
				onClick={() => {
					grid.setGrouping(removeGrouping(grid.grouping(), props.columnId));
				}}
			>
				<svg aria-hidden='true' viewBox='0 0 16 16'>
					<path d='M4.5 4.5l7 7m0-7l-7 7' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round'/>
				</svg>
			</button>
		</span>
	);
}
