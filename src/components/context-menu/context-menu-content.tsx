import type { Placement } from '@floating-ui/dom';
import { createMemo, type JSX, splitProps } from 'solid-js';

import type { AnchorElement } from '../../utils/create-anchored-position';

import { useContextMenuContext } from './context-menu-context';
import { createCloseOnViewportChange } from './create-close-on-viewport-change';
import { focusFirstItem } from './menu-items';
import { MenuPanel, type MenuPanelAttributes } from './menu-panel';
import { pointAnchor } from './menu-point-anchor';

export interface ContextMenuContentProps extends MenuPanelAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Сторона и выравнивание относительно якоря; по умолчанию `bottom-start`. */
	placement?: Placement | undefined;
	/** Вызывается раньше клавиатуры меню. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	/** Корневой элемент меню. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

export function ContextMenuContent(props: ContextMenuContentProps): JSX.Element {
	const context = useContextMenuContext('ContextMenu.Content');
	const [local, rest] = splitProps(props, ['size', 'placement', 'onKeyDown', 'ref', 'class', 'style', 'children']);
	const anchor = createMemo<AnchorElement | undefined>(() => {
		const element = context.anchorElement();
		if (element) {
			return element;
		}
		const point = context.point();
		return point ? pointAnchor(point) : undefined;
	});
	// открытое меню без точки показать некуда
	const open = (): boolean => context.open() && anchor() !== undefined;
	const close = (): void => {
		context.setOpen(false);
	};

	createCloseOnViewportChange({ open, onClose: close });

	return (
		<MenuPanel
			{...rest}
			open={open}
			onDismiss={close}
			anchor={anchor}
			anchorElement={context.area}
			restoreFocusTo={() => {
				// инициатора или строки грида могло не стать в документе: тогда фокус получает якорь, а если и его нет, область вызова
				const opener = context.opener();
				if (opener?.isConnected === true) {
					return opener;
				}
				const anchored = context.anchorElement();
				return anchored?.isConnected === true ? anchored : context.area();
			}}
			// клик по якорю-элементу не снаружи: переключением занимается его обработчик; область вызова не часть меню (раздел 3.3 спека)
			dismissExempt={context.anchorElement}
			placement={local.placement ?? 'bottom-start'}
			gap={2}
			initialFocus={context.source() === 'keyboard' ? focusFirstItem : 'panel'}
			closeAll={close}
			onKeyDown={local.onKeyDown}
			ref={local.ref}
			size={local.size}
			class={local.class}
			style={local.style}
		>
			{local.children}
		</MenuPanel>
	);
}
