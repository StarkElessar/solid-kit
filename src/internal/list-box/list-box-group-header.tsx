import styles from './list-box.module.css';

import { type JSX, onMount } from 'solid-js';

import type { ListGroupRow } from './list-row';

export interface ListBoxGroupHeaderProps {
	row: ListGroupRow;
	index: number;
	measure: (element: HTMLElement) => void;
	renderGroupHeader?: ((label: string) => JSX.Element) | undefined;
}

/** Заголовок группы: не опция, не активируется и не выбирается (`role="presentation"`). */
export function ListBoxGroupHeader(props: ListBoxGroupHeaderProps): JSX.Element {
	let element: HTMLDivElement | undefined;
	onMount(() => {
		if (element) {
			props.measure(element);
		}
	});

	return (
		<div ref={element} role='presentation' data-index={props.index} class={styles['group']}>
			{props.renderGroupHeader ? props.renderGroupHeader(props.row.label) : props.row.label}
		</div>
	);
}
