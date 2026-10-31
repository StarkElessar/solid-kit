import styles from './list-box.module.css';

import { type JSX, onMount, Show } from 'solid-js';

import type { ListBoxController } from './create-list-box-controller';
import type { ListAllRow } from './list-row';
import { optionId } from './option-id';

export interface ListBoxAllOptionProps {
	listId: string;
	row: ListAllRow;
	/** Индекс строки в плоском списке (`data-index` для измерения). */
	index: number;
	controller: ListBoxController;
	measure: (element: HTMLElement) => void;
	label: JSX.Element;
}

/** Строка «Все» MultiSelect: ведёт себя как опция, но в `aria-setsize` и `aria-posinset` не входит. */
export function ListBoxAllOption(props: ListBoxAllOptionProps): JSX.Element {
	const selected = (): boolean => props.controller.isSelected(props.row.key);
	const active = (): boolean => props.controller.activeKey() === props.row.key;
	let element: HTMLDivElement | undefined;
	onMount(() => {
		if (element) {
			props.measure(element);
		}
	});

	return (
		<div
			ref={element}
			role='option'
			id={optionId(props.listId, props.row.key)}
			data-index={props.index}
			data-list-box-all
			aria-selected={selected()}
			data-active={active() ? '' : undefined}
			data-selected={selected() ? '' : undefined}
			class={styles['option']}
			onMouseMove={() => {
				if (!active() || props.controller.activeSource() !== 'pointer') {
					props.controller.setActiveKey(props.row.key, 'pointer');
				}
			}}
			onClick={() => {
				props.controller.activate(props.row.key);
			}}
		>
			<span class={styles['check']} aria-hidden='true'>
				<Show when={selected()}>
					<svg viewBox='0 0 16 16' width='12' height='12'>
						<path
							d='M3.5 8.5 6.5 11.5 12.5 4.5'
							fill='none'
							stroke='currentColor'
							stroke-width='1.75'
							stroke-linecap='round'
							stroke-linejoin='round'
						/>
					</svg>
				</Show>
			</span>
			<span class={styles['label']}>{props.label}</span>
		</div>
	);
}
