import styles from './select.module.css';

import { type JSX, onCleanup, Show, splitProps } from 'solid-js';

import { useSelectContext } from './select-context';

export interface SelectTriggerProps<T>
	extends Omit<
		JSX.ButtonHTMLAttributes<HTMLButtonElement>,
		'class' | 'style' | 'disabled' | 'children' | 'type' | 'role' | 'value' | 'onClick' | 'onKeyDown' | 'onKeyUp'
	> {
	onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent> | undefined;
	onKeyDown?: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> | undefined;
	onKeyUp?: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> | undefined;
	/** Показывается приглушённым цветом, пока значение не выбрано. */
	placeholder?: JSX.Element;
	/** По умолчанию подпись выбранного элемента. */
	renderValue?: ((item: T) => JSX.Element) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function SelectTrigger<T>(props: SelectTriggerProps<T>): JSX.Element {
	const context = useSelectContext('Select.Trigger');
	const [local, rest] = splitProps(props, ['placeholder', 'renderValue', 'class', 'style', 'ref', 'onClick', 'onKeyDown', 'onKeyUp']);

	// у корня один триггер: якорь принадлежит ему, пока он смонтирован
	let own: HTMLButtonElement | undefined;
	onCleanup(() => {
		if (context.anchor() === own) {
			context.setAnchor(undefined);
		}
	});

	// пробел гасится и на keyup: иначе браузер активирует кнопку кликом после того, как мы уже обработали keydown
	let swallowSpaceUp = false;

	const handleKeyDown: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented || context.disabled()) {
			return;
		}
		if (!context.open()) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				swallowSpaceUp = event.key === ' ';
				context.setOpen(true, 'keyboard');
			}
			return;
		}
		if (event.key === 'Tab') {
			context.setOpen(false);
			return;
		}
		if (event.key === ' ') {
			swallowSpaceUp = true;
		}
		if (context.controller.handleKeyDown(event)) {
			event.preventDefault();
		}
	};

	return (
		<button
			{...rest}
			ref={(element) => {
				own = element;
				context.setAnchor(element);
				if (typeof local.ref === 'function') {
					local.ref(element);
				}
			}}
			type='button'
			role='combobox'
			aria-haspopup='listbox'
			aria-expanded={context.open()}
			aria-controls={context.open() ? context.listId : undefined}
			aria-activedescendant={context.open() ? context.controller.activeId() : undefined}
			disabled={context.disabled()}
			data-s-kit
			data-s-kit-size={context.size()}
			class={local.class ? `${styles['trigger']} ${local.class}` : styles['trigger']}
			style={local.style}
			onClick={(event) => {
				local.onClick?.(event);
				if (!event.defaultPrevented && !context.disabled()) {
					context.setAnchor(event.currentTarget);
					context.setOpen(!context.open(), 'pointer');
				}
			}}
			onKeyDown={handleKeyDown}
			onKeyUp={(event) => {
				local.onKeyUp?.(event);
				if (event.key === ' ' && swallowSpaceUp) {
					swallowSpaceUp = false;
					event.preventDefault();
				}
			}}
		>
			<span class={styles['value']}>
				<Show
					when={context.value() !== null && context.value() !== undefined}
					fallback={<span class={styles['placeholder']}>{local.placeholder}</span>}
				>
					{local.renderValue ? local.renderValue(context.value() as T) : context.getLabel(context.value())}
				</Show>
			</span>
			<svg class={styles['chevron']} viewBox='0 0 16 16' width='12' height='12' aria-hidden='true'>
				<path
					d='M3 6 8 11 13 6'
					fill='none'
					stroke='currentColor'
					stroke-width='1.75'
					stroke-linecap='round'
					stroke-linejoin='round'
				/>
			</svg>
		</button>
	);
}
