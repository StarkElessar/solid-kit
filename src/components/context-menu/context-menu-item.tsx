import { type JSX, splitProps } from 'solid-js';

import { MenuItemElement, type MenuItemElementProps } from './menu-item-element';
import { useMenuLevelContext } from './menu-level-context';

export interface ContextMenuItemProps extends Omit<MenuItemElementProps, 'rootRef' | 'trailing'> {
	/** По умолчанию `true`: закрывает всю цепочку меню, а не только подменю. */
	closeOnSelect?: boolean | undefined;
	onSelect?: (() => void) | undefined;
}

export function ContextMenuItem(props: ContextMenuItemProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.Item');
	const [local, rest] = splitProps(props, ['closeOnSelect', 'onSelect', 'onClick']);

	return (
		<MenuItemElement
			{...rest}
			onClick={(event) => {
				local.onClick?.(event);
				if (event.defaultPrevented) {
					return;
				}
				const select = local.onSelect;
				// меню закрывается раньше команды: команда может открыть диалог, а тот должен запомнить уже вернувшийся фокус
				if (local.closeOnSelect !== false) {
					level.closeAll();
				}
				select?.();
			}}
		/>
	);
}
