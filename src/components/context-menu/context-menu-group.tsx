import styles from './context-menu.module.css';

import { createUniqueId, type JSX, splitProps } from 'solid-js';

export interface ContextMenuGroupProps
	extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'role' | 'aria-labelledby' | 'aria-label'> {
	/** Видимая подпись группы; она же даёт группе accessible name. */
	label: string;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Группа пунктов с подписью. Сама в навигации стрелками не участвует: фокус ходит по пунктам внутри. */
export function ContextMenuGroup(props: ContextMenuGroupProps): JSX.Element {
	const [local, rest] = splitProps(props, ['label', 'class', 'style', 'children']);
	const labelId = createUniqueId();

	return (
		<div {...rest} role='group' aria-labelledby={labelId} class={local.class} style={local.style}>
			<div id={labelId} class={styles['group-label']}>{local.label}</div>
			{local.children}
		</div>
	);
}
