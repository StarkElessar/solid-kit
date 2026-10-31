import styles from './multiselect.module.css';

import { type JSX, onMount } from 'solid-js';

export interface MultiSelectChipProps {
	label: string;
	content: JSX.Element;
	removeLabel: string;
	disabled: boolean;
	hidden: boolean;
	onRemove: () => void;
	onMeasure: (element: HTMLElement) => void;
}

/** Чип выбранного значения с кнопкой `×` (обычная нативная кнопка в порядке табуляции). */
export function MultiSelectChip(props: MultiSelectChipProps): JSX.Element {
	let element: HTMLSpanElement | undefined;
	onMount(() => {
		if (element) {
			props.onMeasure(element);
		}
	});

	return (
		<span ref={element} data-multiselect-chip class={styles['chip']} hidden={props.hidden} title={props.label}>
			<span class={styles['chip-label']}>{props.content}</span>
			<button
				type='button'
				class={styles['chip-remove']}
				aria-label={props.removeLabel}
				disabled={props.disabled}
				onClick={() => {
					props.onRemove();
				}}
			>
				<svg viewBox='0 0 16 16' width='10' height='10' aria-hidden='true'>
					<path d='M4 4 12 12M12 4 4 12' fill='none' stroke='currentColor' stroke-width='1.75' stroke-linecap='round'/>
				</svg>
			</button>
		</span>
	);
}
