import styles from './dialog.module.css';

import { createEffect, createUniqueId, type JSX, onCleanup, splitProps } from 'solid-js';

import { useDialogContext } from './dialog-context';

export interface DialogTitleProps extends Omit<JSX.HTMLAttributes<HTMLHeadingElement>, 'class'> {
	class?: string | undefined;
}

/** Заголовок диалога (`h2`); его `id` попадает в `aria-labelledby` диалога. */
export function DialogTitle(props: DialogTitleProps): JSX.Element {
	const context = useDialogContext('Dialog.Title');
	const [local, rest] = splitProps(props, ['class', 'id']);
	const generatedId = createUniqueId();
	const id = (): string => local.id ?? generatedId;

	createEffect(() => {
		context.setTitleId(id());
		onCleanup(() => {
			context.setTitleId(undefined);
		});
	});

	return <h2 {...rest} id={id()} class={local.class ? `${styles['title']} ${local.class}` : styles['title']}/>;
}
