import styles from './dialog.module.css';

import { type JSX, splitProps } from 'solid-js';

export interface DialogFooterProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Подвал диалога: ряд кнопок у правого края, зафиксирован под прокручиваемым телом. */
export function DialogFooter(props: DialogFooterProps): JSX.Element {
	const [local, rest] = splitProps(props, ['class', 'style']);

	return <div {...rest} class={local.class ? `${styles['footer']} ${local.class}` : styles['footer']} style={local.style}/>;
}
