import styles from './pager.module.css';

import { createMemo, For, type JSX } from 'solid-js';

import { Button, type ButtonSize } from '../button';

import type { PagerItem } from './pager-item';

export interface PagerPageButtonsProps {
	items: readonly PagerItem[];
	current: number;
	pageLabel: (page: number) => string;
	disabled: boolean;
	size: ButtonSize | undefined;
	onSelect: (page: number) => void;
}

/**
 * Ряд номеров страниц. Ключ элемента это сам номер (у многоточия отрицательный по позиции): `For` ключуется по значению, поэтому кнопка
 * страницы, которая осталась в ряду, не пересоздаётся при смене текущей и не теряет фокус.
 */
export function PagerPageButtons(props: PagerPageButtonsProps): JSX.Element {
	const keys = createMemo(() => props.items.map((item, index) => (item.kind === 'page' ? item.page : -(index + 1))));

	return (
		<span class={styles['pages']}>
			<For each={keys()}>
				{(key) =>
					key > 0
						? (
							<Button
								variant={key === props.current ? 'tinted' : 'plain'}
								size={props.size}
								disabled={props.disabled}
								aria-label={props.pageLabel(key)}
								aria-current={key === props.current ? 'page' : undefined}
								onClick={() => {
									props.onSelect(key);
								}}
							>{key}</Button>
						)
						: <span class={styles['gap']} data-pager-gap aria-hidden='true'>…</span>}
			</For>
		</span>
	);
}
