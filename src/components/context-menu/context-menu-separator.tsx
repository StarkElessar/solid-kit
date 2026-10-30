import styles from './context-menu.module.css';

import { type JSX, splitProps } from 'solid-js';

export interface ContextMenuSeparatorProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'role' | 'children'> {
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function ContextMenuSeparator(props: ContextMenuSeparatorProps): JSX.Element {
	const [local, rest] = splitProps(props, ['class', 'style']);
	return (
		<div
			{...rest}
			role='separator'
			class={local.class ? `${styles['separator']} ${local.class}` : styles['separator']}
			style={local.style}
		/>
	);
}
