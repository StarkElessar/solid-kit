import { createMemo, type JSX, splitProps } from 'solid-js';

import { useContextMenuContext } from './context-menu-context';
import { createCloseOnViewportChange } from './create-close-on-viewport-change';
import { focusFirstItem } from './menu-items';
import { MenuPanel, type MenuPanelAttributes } from './menu-panel';
import { pointAnchor } from './menu-point-anchor';

export interface ContextMenuContentProps extends MenuPanelAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
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
	const [local, rest] = splitProps(props, ['size', 'onKeyDown', 'ref', 'class', 'style', 'children']);
	const anchor = createMemo(() => {
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
			restoreFocusTo={() => context.opener() ?? context.area()}
			// область вызова не часть меню: клик в другом месте области закрывает меню (раздел 3.3 спека)
			dismissExempt={() => undefined}
			placement='bottom-start'
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
