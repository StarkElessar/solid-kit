import { type JSX, splitProps } from 'solid-js';

import { focusFirstItem } from './menu-items';
import { useMenuLevelContext } from './menu-level-context';
import { MenuPanel, type MenuPanelAttributes } from './menu-panel';
import { useSubContext } from './sub-context';

export interface ContextMenuSubContentProps extends MenuPanelAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Вызывается раньше клавиатуры меню. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	/** Корневой элемент подменю. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/** Панель подменю: вложенный слой стека с якорем на `SubTrigger`; ArrowLeft закрывает её, фокус возвращается на `SubTrigger`. */
export function ContextMenuSubContent(props: ContextMenuSubContentProps): JSX.Element {
	const sub = useSubContext('ContextMenu.SubContent');
	const level = useMenuLevelContext('ContextMenu.SubContent');
	const [local, rest] = splitProps(props, ['size', 'onKeyDown', 'ref', 'class', 'style', 'children']);

	return (
		<MenuPanel
			{...rest}
			id={sub.contentId}
			aria-labelledby={sub.triggerId}
			open={sub.open}
			onDismiss={() => {
				sub.setOpen(false);
			}}
			anchor={sub.trigger}
			placement='right-start'
			gap={2}
			initialFocus={sub.source() === 'keyboard' ? focusFirstItem : 'none'}
			closeAll={level.closeAll}
			onKeyDown={(event) => {
				local.onKeyDown?.(event);
				if (!event.defaultPrevented && event.key === 'ArrowLeft') {
					event.preventDefault();
					sub.setOpen(false);
				}
			}}
			ref={local.ref}
			size={local.size}
			class={local.class}
			style={local.style}
		>
			{local.children}
		</MenuPanel>
	);
}
