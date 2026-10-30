import { type JSX, onCleanup, splitProps } from 'solid-js';

import { useContextMenuContext } from './context-menu-context';
import { elementPoint } from './menu-point-anchor';

export interface ContextMenuTriggerProps
	extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'ref' | 'onContextMenu' | 'onKeyDown'> {
	/** Отключённая область не перехватывает событие: появляется системное меню. */
	disabled?: boolean | undefined;
	onContextMenu?: JSX.EventHandler<HTMLDivElement, MouseEvent> | undefined;
	onKeyDown?: JSX.EventHandler<HTMLDivElement, KeyboardEvent> | undefined;
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/** Область вызова меню. Клавиша ContextMenu и Shift+F10 на элементе внутри неё открывают меню у его нижнего левого угла. */
export function ContextMenuTrigger(props: ContextMenuTriggerProps): JSX.Element {
	const context = useContextMenuContext('ContextMenu.Trigger');
	const [local, rest] = splitProps(props, ['disabled', 'onContextMenu', 'onKeyDown', 'ref', 'class', 'style']);

	// общая область принадлежит той, из которой меню открыто
	let own: HTMLElement | undefined;
	onCleanup(() => {
		if (context.area() === own) {
			context.setArea(undefined);
		}
	});

	return (
		<div
			{...rest}
			ref={(element) => {
				own = element;
				context.setArea(element);
				local.ref?.(element);
			}}
			class={local.class}
			style={local.style}
			onContextMenu={(event) => {
				local.onContextMenu?.(event);
				if (local.disabled || event.defaultPrevented) {
					return;
				}
				event.preventDefault();
				context.setArea(event.currentTarget);
				context.openAt({ x: event.clientX, y: event.clientY }, 'pointer');
			}}
			onKeyDown={(event) => {
				local.onKeyDown?.(event);
				if (local.disabled || event.defaultPrevented) {
					return;
				}
				if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
					event.preventDefault();
					context.setArea(event.currentTarget);
					context.openAt(elementPoint(event.target instanceof Element ? event.target : event.currentTarget), 'keyboard');
				}
			}}
		/>
	);
}
