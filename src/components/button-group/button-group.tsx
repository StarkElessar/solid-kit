import styles from './button-group.module.css';

import { type JSX, splitProps } from 'solid-js';

export type ButtonGroupSize = 'sm' | 'md' | 'lg';

export interface ButtonGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	size?: ButtonGroupSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
	const [local, rest] = splitProps(props, ['size', 'class', 'style']);

	return (
		<div
			role='group'
			{...rest}
			data-s-kit
			data-s-kit-size={local.size}
			data-s-kit-focus-inset
			class={local.class ? `${styles['root']} ${local.class}` : styles['root']}
			style={local.style}
		/>
	);
}
