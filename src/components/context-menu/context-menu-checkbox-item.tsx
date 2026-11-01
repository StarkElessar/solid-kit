import styles from './context-menu.module.css';

import { type JSX, splitProps } from 'solid-js';

import { MenuItemElement, type MenuItemElementProps } from './menu-item-element';
import { useMenuLevelContext } from './menu-level-context';

export interface ContextMenuCheckboxItemProps extends Omit<MenuItemElementProps, 'rootRef' | 'trailing' | 'leading' | 'role'> {
	checked: boolean;
	onCheckedChange?: ((checked: boolean) => void) | undefined;
	/** По умолчанию `false`: переключатель оставляет меню открытым. */
	closeOnSelect?: boolean | undefined;
}

/** Пункт-переключатель: отметка слева, `role="menuitemcheckbox"`. Состояние хранит вызывающий (controlled). */
export function ContextMenuCheckboxItem(props: ContextMenuCheckboxItemProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.CheckboxItem');
	const [local, rest] = splitProps(props, ['checked', 'onCheckedChange', 'closeOnSelect', 'onClick']);

	return (
		<MenuItemElement
			{...rest}
			role='menuitemcheckbox'
			aria-checked={local.checked}
			leading={(
				<svg class={styles['check']} data-checked={local.checked ? '' : undefined} viewBox='0 0 16 16' aria-hidden='true'>
					<path
						d='M3.5 8.5l3 3 6-7'
						fill='none'
						stroke='currentColor'
						stroke-width='1.8'
						stroke-linecap='round'
						stroke-linejoin='round'
					/>
				</svg>
			)}
			onClick={(event) => {
				local.onClick?.(event);
				if (event.defaultPrevented) {
					return;
				}
				const next = !local.checked;
				// меню закрывается раньше команды, как у ContextMenu.Item
				if (local.closeOnSelect === true) {
					level.closeAll();
				}
				local.onCheckedChange?.(next);
			}}
		/>
	);
}
