import { type JSX, onCleanup, Show, splitProps } from 'solid-js';

import { Button, type ButtonProps } from '../button/button';

import { usePopoverContext } from './popover-context';

/** Атрибуты, которые инициатор передаёт своему «рендеру»: их нужно повесить на корневой элемент пользовательского инициатора. */
export interface PopoverTriggerAttributes {
	ref: (element: HTMLElement) => void;
	'aria-expanded': boolean;
	'aria-controls': string;
	'data-popover-open': '' | undefined;
	onClick: JSX.EventHandler<HTMLElement, MouseEvent>;
}

export interface PopoverTriggerProps extends Omit<ButtonProps, 'onClick'> {
	onClick?: JSX.EventHandler<HTMLElement, MouseEvent> | undefined;
	/** Свой инициатор вместо Button: `render={(attributes) => <IconButton {...attributes} aria-label='Меню'>…</IconButton>}`. */
	render?: ((attributes: PopoverTriggerAttributes) => JSX.Element) | undefined;
}

export function PopoverTrigger(props: PopoverTriggerProps): JSX.Element {
	const context = usePopoverContext('Popover.Trigger');
	const [local, rest] = splitProps(props, ['render', 'onClick', 'ref']);

	// у корня может быть несколько инициаторов: общий якорь принадлежит тому, которым панель открыта
	let own: HTMLElement | undefined;
	onCleanup(() => {
		if (context.anchor() === own) {
			context.setAnchor(undefined);
		}
	});

	const attributes: PopoverTriggerAttributes = {
		ref: (element) => {
			own = element;
			context.setAnchor(element);
			// публичный ref Button не теряется: компилятор Solid передаёт любой ref дочернему компоненту функцией
			if (typeof local.ref === 'function') {
				local.ref(element as HTMLButtonElement);
			}
		},
		get 'aria-expanded'() {
			return context.open();
		},
		'aria-controls': context.contentId,
		get 'data-popover-open'() {
			return context.open() ? '' : undefined;
		},
		onClick: (event) => {
			local.onClick?.(event);
			if (!event.defaultPrevented) {
				if (!context.open()) {
					// хост панели и возврат фокуса считаются от инициатора, по которому нажали, а не от последнего смонтированного
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
