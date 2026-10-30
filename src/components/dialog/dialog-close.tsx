import { type JSX, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button/button';

import { useDialogContext } from './dialog-context';

export interface DialogCloseProps extends Omit<ButtonProps, 'onClick'> {
	onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent> | undefined;
}

/** Button, закрывающий диалог; пользовательский `onClick` вызывается первым, `preventDefault()` отменяет закрытие. */
export function DialogClose(props: DialogCloseProps): JSX.Element {
	const context = useDialogContext('Dialog.Close');
	const [local, rest] = splitProps(props, ['onClick']);

	return (
		<Button
			{...rest}
			onClick={(event) => {
				local.onClick?.(event);
				if (!event.defaultPrevented) {
					context.setOpen(false);
				}
			}}
		/>
	);
}
