import styles from './dialog.module.css';

import { createEffect, createUniqueId, type JSX, onCleanup, splitProps } from 'solid-js';

import { useDialogContext } from './dialog-context';

export interface DialogDescriptionProps extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'class'> {
	class?: string | undefined;
}

/** Описание диалога (`p`); его `id` попадает в `aria-describedby` диалога. */
export function DialogDescription(props: DialogDescriptionProps): JSX.Element {
	const context = useDialogContext('Dialog.Description');
	const [local, rest] = splitProps(props, ['class', 'id']);
	const generatedId = createUniqueId();
	const id = (): string => local.id ?? generatedId;

	createEffect(() => {
		context.setDescriptionId(id());
		onCleanup(() => {
			context.setDescriptionId(undefined);
		});
	});

	return <p {...rest} id={id()} class={local.class ? `${styles['description']} ${local.class}` : styles['description']}/>;
}
