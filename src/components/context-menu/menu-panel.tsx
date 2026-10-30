import styles from './context-menu.module.css';

import type { Placement } from '@floating-ui/dom';
import { type Accessor, createEffect, createSignal, type JSX, splitProps } from 'solid-js';

import { FloatingPanel, type FloatingPanelAttributes } from '../../internal/floating-panel/floating-panel';
import type { InitialFocusMode } from '../../internal/floating-panel/focus-initial';
import type { AnchorElement } from '../../utils/create-anchored-position';

import { isItemDisabled, itemOf, menuItems } from './menu-items';
import { MenuLevelContext, type MenuLevelContextValue } from './menu-level-context';
import { nextMenuItemIndex } from './menu-navigation';

/** Атрибуты панели меню, кроме занятых компонентом (роль задаёт сама оболочка). */
export type MenuPanelAttributes = Omit<FloatingPanelAttributes, 'role'>;

export interface MenuPanelProps extends MenuPanelAttributes {
	open: Accessor<boolean>;
	onDismiss: () => void;
	anchor: Accessor<AnchorElement | undefined>;
	anchorElement?: Accessor<Element | undefined> | undefined;
	restoreFocusTo?: Accessor<Element | undefined> | undefined;
	dismissExempt?: Accessor<Element | undefined> | undefined;
	placement: Placement;
	gap: number;
	initialFocus?: InitialFocusMode | undefined;
	/** Закрывает корневое меню (а с ним все подменю): Tab и активация пункта. */
	closeAll: () => void;
	/** Вызывается раньше клавиатуры меню: подменю обрабатывает здесь ArrowLeft. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	/** Корневой элемент панели. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

function preventDefault(event: Event): void {
	event.preventDefault();
}

/** Один уровень меню (корень или подменю): `role="menu"`, внутреннее кольцо фокуса, клавиатура и контекст уровня для пунктов. */
export function MenuPanel(props: MenuPanelProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'open',
		'onDismiss',
		'anchor',
		'anchorElement',
		'restoreFocusTo',
		'dismissExempt',
		'placement',
		'gap',
		'initialFocus',
		'closeAll',
		'onKeyDown',
		'ref',
		'size',
		'class',
		'style',
		'children'
	]);
	const [activeItem, setActiveItem] = createSignal<HTMLElement>();

	// пункты пересоздаются при каждом открытии: прежний активный пункт уже не в DOM
	createEffect(() => {
		if (!local.open()) {
			setActiveItem(undefined);
		}
	});

	const level: MenuLevelContextValue = {
		closeAll: () => {
			local.closeAll();
		},
		activeItem,
		setActiveItem: (item) => {
			setActiveItem(item);
		}
	};

	const handleKeyDown = (event: KeyboardEvent & { currentTarget: HTMLDivElement }): void => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented) {
			return;
		}
		const panel = event.currentTarget;
		if (event.key === 'Tab') {
			// фокус не уходит дальше инициатора: меню закрывается, фокус возвращается тому, кто держал его до открытия
			event.preventDefault();
			local.closeAll();
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			const item = itemOf(panel, event.target);
			if (item) {
				event.preventDefault();
				item.click();
			}
			return;
		}
		const items = menuItems(panel);
		const current = items.findIndex((item) => item === document.activeElement);
		const next = nextMenuItemIndex(event.key, current, items.map(isItemDisabled));
		if (next !== null) {
			event.preventDefault();
			items[next]?.focus();
		}
	};

	return (
		<MenuLevelContext.Provider value={level}>
			<FloatingPanel
				{...rest}
				role='menu'
				tabIndex={-1}
				data-s-kit-menu
				data-s-kit-focus-inset
				open={local.open}
				onDismiss={local.onDismiss}
				anchor={local.anchor}
				anchorElement={local.anchorElement}
				restoreFocusTo={local.restoreFocusTo}
				dismissExempt={local.dismissExempt}
				placement={local.placement}
				gap={local.gap}
				initialFocus={local.initialFocus}
				onKeyDown={handleKeyDown}
				panelRef={(element) => {
					// правая кнопка по самому меню не вызывает системное меню; нативный слушатель не останавливает всплытие
					element.addEventListener('contextmenu', preventDefault);
					local.ref?.(element);
				}}
				size={local.size}
				class={local.class ? `${styles['content']} ${local.class}` : styles['content']}
				style={local.style}
			>
				{local.children}
			</FloatingPanel>
		</MenuLevelContext.Provider>
	);
}
