import styles from './button.module.css';

import { type JSX, mergeProps, splitProps } from 'solid-js';

export type ButtonVariant = 'primary' | 'tinted' | 'plain' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'style'> {
	variant?: ButtonVariant | undefined;
	size?: ButtonSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function Button(props: ButtonProps): JSX.Element {
	const merged = mergeProps({ variant: 'primary', type: 'button' } as const, props);
	const [local, rest] = splitProps(merged, ['variant', 'size', 'class', 'style']);

	return (
		<button
			{...rest}
			data-s-kit
			data-variant={local.variant}
			data-s-kit-size={local.size}
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		/>
	);
}
