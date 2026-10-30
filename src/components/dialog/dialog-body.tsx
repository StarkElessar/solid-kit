import styles from './dialog.module.css';

import { type JSX, splitProps } from 'solid-js';

export interface DialogBodyProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Прокручиваемое тело диалога; вокруг содержимого резервирует место под внешнее кольцо фокуса (критерий 7). */
export function DialogBody(props: DialogBodyProps): JSX.Element {
	const [local, rest] = splitProps(props, ['class', 'style']);

	return <div {...rest} class={local.class ? `${styles['body']} ${local.class}` : styles['body']} style={local.style}/>;
}
