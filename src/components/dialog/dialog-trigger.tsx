import { type JSX, onCleanup, Show, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button/button';

import { useDialogContext } from './dialog-context';

/** Атрибуты, которые инициатор передаёт своему «рендеру»: их нужно повесить на корневой элемент пользовательского инициатора. */
export interface DialogTriggerAttributes {
	ref: (element: HTMLElement) => void;
	'aria-haspopup': 'dialog';
	'aria-expanded': boolean;
	'aria-controls': string;
	'data-dialog-open': '' | undefined;
	onClick: JSX.EventHandler<HTMLElement, MouseEvent>;
}

export interface DialogTriggerProps extends Omit<ButtonProps, 'onClick'> {
	onClick?: JSX.EventHandler<HTMLElement, MouseEvent> | undefined;
	/** Свой инициатор вместо Button: `render={(attributes) => <IconButton {...attributes} aria-label='Настройки'>…</IconButton>}`. */
	render?: ((attributes: DialogTriggerAttributes) => JSX.Element) | undefined;
}

export function DialogTrigger(props: DialogTriggerProps): JSX.Element {
	const context = useDialogContext('Dialog.Trigger');
	const [local, rest] = splitProps(props, ['render', 'onClick', 'ref']);

	// у корня может быть несколько инициаторов: общий якорь принадлежит тому, которым диалог открыт
	let own: HTMLElement | undefined;
	onCleanup(() => {
		if (context.anchor() === own) {
			context.setAnchor(undefined);
		}
	});

	const attributes: DialogTriggerAttributes = {
		ref: (element) => {
			own = element;
			context.setAnchor(element);
			// публичный ref Button не теряется: компилятор Solid передаёт любой ref дочернему компоненту функцией
			if (typeof local.ref === 'function') {
				local.ref(element as HTMLButtonElement);
			}
		},
		'aria-haspopup': 'dialog',
		get 'aria-expanded'() {
			return context.open();
		},
		'aria-controls': context.contentId,
		get 'data-dialog-open'() {
			return context.open() ? '' : undefined;
		},
		onClick: (event) => {
			local.onClick?.(event);
			if (!event.defaultPrevented) {
				if (!context.open()) {
					// хост диалога и возврат фокуса считаются от инициатора, по которому нажали, а не от последнего смонтированного
					context.setAnchor(event.currentTarget);
				}
				context.setOpen(!context.open());
			}
		}
	};

	return (
		<Show when={local.render} fallback={<Button {...rest} {...attributes}/>}>
			{(render) => render()(attributes)}
		</Show>
	);
}
