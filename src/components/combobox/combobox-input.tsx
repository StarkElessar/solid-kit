import styles from './combobox.module.css';

import { type JSX, splitProps } from 'solid-js';

import { Input, type InputProps } from '../input';

import { useComboboxContext } from './combobox-context';

export interface ComboboxInputProps
	extends Omit<
		InputProps,
		'class' | 'style' | 'size' | 'value' | 'defaultValue' | 'onValueChange' | 'role' | 'disabled' | 'onKeyDown' | 'onBlur' | 'ref'
	> {
	onKeyDown?: JSX.EventHandler<HTMLInputElement, KeyboardEvent> | undefined;
	onBlur?: JSX.EventHandler<HTMLInputElement, FocusEvent> | undefined;
	/** Доступное имя кнопки-шеврона; по умолчанию «Показать список». */
	toggleLabel?: string | undefined;
	/** Класс и стиль оболочки поля (она задаёт ширину). */
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function ComboboxInput(props: ComboboxInputProps): JSX.Element {
	const context = useComboboxContext('Combobox.Input');
	const [local, rest] = splitProps(props, ['toggleLabel', 'class', 'style', 'onKeyDown', 'onBlur']);

	const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented || context.disabled()) {
			return;
		}
		if (!context.open()) {
			if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
				event.preventDefault();
				context.setOpen(true, 'keyboard');
			}
			return;
		}
		if (event.key === 'Tab') {
			context.setOpen(false);
			return;
		}
		if (context.controller.handleKeyDown(event)) {
			event.preventDefault();
		}
	};

	return (
		<span
			ref={(element) => {
				context.setAnchor(element);
			}}
			data-s-kit
			data-s-kit-size={context.size()}
			class={local.class ? `${styles['field']} ${local.class}` : styles['field']}
			style={local.style}
		>
			<Input
				{...rest}
				ref={(element: HTMLInputElement) => {
					context.setInput(element);
				}}
				class={styles['input']}
				size={context.size()}
				role='combobox'
				autocomplete='off'
				aria-autocomplete='list'
				aria-haspopup='listbox'
				aria-expanded={context.open()}
				aria-controls={context.open() ? context.listId : undefined}
				aria-activedescendant={context.open() ? context.controller.activeId() : undefined}
				disabled={context.disabled()}
				value={context.query()}
				onValueChange={context.handleInput}
				onKeyDown={handleKeyDown}
				onBlur={(event) => {
					local.onBlur?.(event);
					if (!event.defaultPrevented) {
						context.handleBlur();
					}
				}}
			/>
			<button
				type='button'
				tabindex='-1'
				aria-label={local.toggleLabel ?? 'Показать список'}
				aria-expanded={context.open()}
				disabled={context.disabled()}
				class={styles['toggle']}
				// фокус остаётся в поле: иначе клик по шеврону считался бы уходом из поля
				onMouseDown={(event) => {
					event.preventDefault();
				}}
				onClick={() => {
					context.setOpen(!context.open(), 'pointer');
					context.input()?.focus();
				}}
			>
				<svg viewBox='0 0 16 16' width='12' height='12' aria-hidden='true'>
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
		</span>
	);
}
