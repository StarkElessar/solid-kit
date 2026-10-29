import styles from './input.module.css';

import { type JSX, mergeProps, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps
	extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'class' | 'style' | 'size' | 'value' | 'defaultValue' | 'onInput'> {
	value?: string | undefined;
	defaultValue?: string | undefined;
	onValueChange?: ((value: string) => void) | undefined;
	size?: InputSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function Input(props: InputProps): JSX.Element {
	const merged = mergeProps({ type: 'text' } as const, props);
	const [local, rest] = splitProps(merged, ['value', 'defaultValue', 'onValueChange', 'size', 'class', 'style']);

	const [value, setValue] = createControllableSignal<string>({
		name: 'Input',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? '',
		onChange: (next) => local.onValueChange?.(next)
	});

	const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
		setValue(event.currentTarget.value);
		// контролируемый режим: родитель мог не принять значение, тогда поле возвращается к нему
		if (event.currentTarget.value !== value()) {
			event.currentTarget.value = value();
		}
	};

	return (
		<input
			{...rest}
			value={value()}
			onInput={handleInput}
			data-s-kit
			data-s-kit-size={local.size}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		/>
	);
}
