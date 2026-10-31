import styles from './list-box.module.css';

import { type Accessor, type JSX, onMount, Show } from 'solid-js';

import type { ListBoxController } from './create-list-box-controller';
import type { ListOptionRow } from './list-row';
import { optionId } from './option-id';

export interface OptionState {
	selected: Accessor<boolean>;
	active: Accessor<boolean>;
	disabled: boolean;
}

export interface ListBoxOptionProps<T> {
	listId: string;
	row: Accessor<ListOptionRow<T>>;
	/** Индекс строки в плоском списке (`data-index` для измерения). */
	index: number;
	/** Число опций списка: `aria-setsize`. */
	setSize: Accessor<number>;
	controller: ListBoxController;
	measure: (element: HTMLElement) => void;
	renderOption?: ((item: T, state: OptionState) => JSX.Element) | undefined;
}

export function ListBoxOption<T>(props: ListBoxOptionProps<T>): JSX.Element {
	const selected = (): boolean => props.controller.isSelected(props.row().key);
	const active = (): boolean => props.controller.activeKey() === props.row().key;
	let element: HTMLDivElement | undefined;
	// измерение читает data-index: к моменту монтирования атрибуты уже выставлены
	onMount(() => {
		if (element) {
			props.measure(element);
		}
	});

	return (
		<div
			ref={element}
			role='option'
			id={optionId(props.listId, props.row().key)}
			data-index={props.index}
			aria-selected={selected()}
			aria-disabled={props.row().disabled ? true : undefined}
			aria-setsize={props.setSize()}
			aria-posinset={props.row().optionIndex + 1}
			data-active={active() ? '' : undefined}
			data-selected={selected() ? '' : undefined}
			title={props.row().label}
			class={styles['option']}
			onMouseMove={() => {
				if (!props.row().disabled && (!active() || props.controller.activeSource() !== 'pointer')) {
					props.controller.setActiveKey(props.row().key, 'pointer');
				}
			}}
			onClick={() => {
				props.controller.activate(props.row().key);
			}}
		>
			<Show
				when={props.renderOption}
				fallback={(
					<>
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
						<span class={styles['label']}>{props.row().label}</span>
					</>
				)}
			>
				{(render) => render()(props.row().item, { selected, active, disabled: props.row().disabled })}
			</Show>
		</div>
	);
}
