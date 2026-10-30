import styles from './context-menu.module.css';

import { type JSX, splitProps } from 'solid-js';

import { revealTruncatedTitle } from './menu-items';
import { useMenuLevelContext } from './menu-level-context';

type OwnedAttribute = 'class' | 'style' | 'role' | 'ref' | 'onClick' | 'onPointerMove' | 'onFocus' | 'children';

export interface MenuItemElementProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, OwnedAttribute> {
	variant?: 'default' | 'danger' | undefined;
	disabled?: boolean | undefined;
	onClick?: JSX.EventHandler<HTMLDivElement, MouseEvent> | undefined;
	onPointerMove?: JSX.EventHandler<HTMLDivElement, PointerEvent> | undefined;
	/** Корневой элемент пункта. */
	rootRef?: ((element: HTMLDivElement) => void) | undefined;
	/** Содержимое после подписи, не обрезаемое многоточием (стрелка подменю). */
	trailing?: JSX.Element;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/** Общий элемент пункта меню: роль, `tabindex="-1"`, фокус под указателем, подпись с многоточием. Поведение активации задают обёртки. */
export function MenuItemElement(props: MenuItemElementProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.Item');
	const [local, rest] = splitProps(props, [
		'variant',
		'disabled',
		'onClick',
		'onPointerMove',
		'rootRef',
		'trailing',
		'class',
		'style',
		'children'
	]);

	return (
		<div
			{...rest}
			ref={(element) => {
				local.rootRef?.(element);
			}}
			role='menuitem'
			tabIndex={-1}
			aria-disabled={local.disabled ? 'true' : undefined}
			data-variant={local.variant === 'danger' ? 'danger' : undefined}
			class={local.class ? `${styles['item']} ${local.class}` : styles['item']}
			style={local.style}
			onFocus={(event) => {
				level.setActiveItem(event.currentTarget);
			}}
			onClick={(event) => {
				if (!local.disabled) {
					local.onClick?.(event);
				}
			}}
			onPointerMove={(event) => {
				local.onPointerMove?.(event);
				if (local.disabled) {
					return;
				}
				const item = event.currentTarget;
				if (document.activeElement !== item) {
					item.focus({ preventScroll: true });
				}
				revealTruncatedTitle(item);
			}}
		>
			<span data-s-kit-menu-label class={styles['label']}>{local.children}</span>
			{local.trailing}
		</div>
	);
}
