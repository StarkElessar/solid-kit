import styles from './time-columns.module.css';

import { createEffect, For, type JSX, on, onMount } from 'solid-js';

import type { TimeColumnId } from './time-column-id';
import { TimeOption } from './time-option';
import type { TimeRow } from './time-row';

export interface TimeColumnProps {
	id: TimeColumnId;
	label: string;
	rows: readonly TimeRow[];
	selectedId: number | null;
	highlightedId: number | null;
	/** Строка, на которой стоит roving tabindex. */
	focusId: number;
	/** Строка, которую колонка держит по центру видимой области при открытии и смене значения; `null`, если прокручивать нечего. */
	anchorId: number | null;
	isAllowed: (id: number) => boolean;
	/** Первая колонка получает фокус при открытии стрелкой. */
	focusTarget: boolean;
	onPick: (id: number) => void;
}

export function TimeColumn(props: TimeColumnProps): JSX.Element {
	let list: HTMLDivElement | undefined;

	// без анимации и без scrollIntoView: прокручивается только сама колонка; панель к этому моменту уже показана и измерима
	const center = (): void => {
		if (!list || props.anchorId === null || list.clientHeight === 0) {
			return;
		}
		const row = list.querySelector<HTMLElement>(`[data-id="${props.anchorId}"]`);
		if (row) {
			list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
		}
	};
	onMount(() => {
		requestAnimationFrame(center);
	});
	createEffect(on(() => props.anchorId, () => {
		requestAnimationFrame(center);
	}, { defer: true }));

	return (
		<div
			ref={list}
			role='listbox'
			aria-label={props.label}
			aria-orientation='vertical'
			class={styles['column']}
			data-time-column={props.id}
		>
			<For each={props.rows}>
				{(row) => (
					<TimeOption
						id={row.id}
						label={row.label}
						selected={props.selectedId === row.id}
						highlighted={props.highlightedId === row.id}
						disabled={!props.isAllowed(row.id)}
						focusable={props.focusId === row.id}
						focusTarget={props.focusTarget && props.focusId === row.id}
						onPick={props.onPick}
					/>
				)}
			</For>
		</div>
	);
}
