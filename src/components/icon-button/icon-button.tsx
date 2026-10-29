import styles from './icon-button.module.css';

import { type JSX, mergeProps, splitProps } from 'solid-js';

import type { ButtonSize, ButtonVariant } from '../button';

export type IconButtonVariant = ButtonVariant;
export type IconButtonSize = ButtonSize;

export interface IconButtonProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'style' | 'aria-label'> {
	/** Обязателен: у кнопки без текста нет другого доступного имени. */
	'aria-label': string;
	variant?: IconButtonVariant | undefined;
	size?: IconButtonSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function IconButton(props: IconButtonProps): JSX.Element {
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
