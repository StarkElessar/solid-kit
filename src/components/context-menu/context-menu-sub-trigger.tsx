import styles from './context-menu.module.css';

import { type JSX, onCleanup, splitProps } from 'solid-js';

import { MenuItemElement, type MenuItemElementProps } from './menu-item-element';
import { focusFirstItem } from './menu-items';
import { useSubContext } from './sub-context';

/** Задержка наведения до открытия подменю, мс (спек этапа 2, раздел 6; «безопасный треугольник» это тех. долг SK-1). */
const HOVER_OPEN_DELAY = 120;

export interface ContextMenuSubTriggerProps
	extends Omit<MenuItemElementProps, 'rootRef' | 'trailing' | 'onKeyDown' | 'onPointerLeave'> {
	onKeyDown?: JSX.EventHandler<HTMLDivElement, KeyboardEvent> | undefined;
	onPointerLeave?: JSX.EventHandler<HTMLDivElement, PointerEvent> | undefined;
}

/** Пункт со стрелкой, открывающий подменю: ArrowRight, Enter, Space, клик, наведение через 120 мс. */
export function ContextMenuSubTrigger(props: ContextMenuSubTriggerProps): JSX.Element {
	const sub = useSubContext('ContextMenu.SubTrigger');
	const [local, rest] = splitProps(props, ['onClick', 'onKeyDown', 'onPointerMove', 'onPointerLeave']);

	let timer: ReturnType<typeof setTimeout> | undefined;
	const clearTimer = (): void => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};
	onCleanup(clearTimer);

	// у подменю один вызывающий пункт; снимается только своим владельцем
	let own: HTMLElement | undefined;
	onCleanup(() => {
		if (sub.trigger() === own) {
			sub.setTrigger(undefined);
		}
	});

	return (
		<MenuItemElement
			{...rest}
			id={sub.triggerId}
			rootRef={(element) => {
				own = element;
				sub.setTrigger(element);
			}}
			aria-haspopup='menu'
			aria-expanded={sub.open()}
			aria-controls={sub.open() ? sub.contentId : undefined}
			trailing={<span class={styles['chevron']} aria-hidden='true'/>}
			onClick={(event) => {
				local.onClick?.(event);
				if (!event.defaultPrevented) {
					sub.setOpen(true, 'pointer');
				}
			}}
			onPointerMove={(event) => {
				local.onPointerMove?.(event);
				if (props.disabled || sub.open() || timer !== undefined) {
					return;
				}
				timer = setTimeout(() => {
					timer = undefined;
					sub.setOpen(true, 'pointer');
				}, HOVER_OPEN_DELAY);
			}}
			onPointerLeave={(event) => {
				local.onPointerLeave?.(event);
				clearTimer();
			}}
			onKeyDown={(event) => {
				local.onKeyDown?.(event);
				if (event.defaultPrevented || props.disabled) {
					return;
				}
				if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') {
					// отменённое событие клавиатура уровня пропускает: иначе Enter и Space вызвали бы там click() и открыли подменю как мышью
					event.preventDefault();
					const wasOpen = sub.open();
					sub.setOpen(true, 'keyboard');
					const panel = document.getElementById(sub.contentId);
					if (wasOpen && panel) {
						focusFirstItem(panel);
					}
				}
			}}
		/>
	);
}
