import type { Placement } from '@floating-ui/dom';
import { type Accessor, createSignal, type JSX, Show, splitProps } from 'solid-js';

import { type AnchorElement, createAnchoredPosition } from '../../utils/create-anchored-position';
import { createPanelLayer } from '../../utils/create-panel-layer';
import { PanelPortal } from '../panel/panel-portal';

import { blocksImplicitSubmit } from './blocks-implicit-submit';
import { createFocusOnOpen } from './create-focus-on-open';
import { createFocusRestore } from './create-focus-restore';
import type { InitialFocusMode } from './focus-initial';
import { type IsolatedEventProp, isolationHandlers } from './panel-isolation';

/** Атрибуты корня панели, которые компонент может принять от пользователя: события, занятые изоляцией, и `ref` исключены. */
export type FloatingPanelAttributes = Omit<
	JSX.HTMLAttributes<HTMLDivElement>,
	IsolatedEventProp | 'onKeyDown' | 'ref' | 'class' | 'style' | 'children'
>;

export interface FloatingPanelProps extends FloatingPanelAttributes {
	open: Accessor<boolean>;
	/** Клик снаружи или Esc. */
	onDismiss: () => void;
	/** Якорь позиционирования: элемент или виртуальный (точка клика). */
	anchor: Accessor<AnchorElement | undefined>;
	/** Реальный элемент инициатора для выбора хоста и возврата фокуса; по умолчанию сам якорь, если он элемент. */
	anchorElement?: Accessor<Element | undefined> | undefined;
	/**
	 * Элемент, pointerdown по которому не считается кликом снаружи (кнопка Popover). По умолчанию это `anchorElement`;
	 * ContextMenu передаёт `() => undefined`: его область вызова не часть меню, клик по ней закрывает меню.
	 */
	dismissExempt?: Accessor<Element | undefined> | undefined;
	/** Кому вернуть фокус при закрытии; по умолчанию инициатор (`anchorElement`). Меню возвращает фокус тому, кто держал его раньше. */
	restoreFocusTo?: Accessor<Element | undefined> | undefined;
	placement?: Placement | undefined;
	gap?: number | undefined;
	matchAnchorWidth?: boolean | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Куда переносится фокус при открытии, по умолчанию на первый табулируемый элемент. */
	initialFocus?: InitialFocusMode | undefined;
	/** Вызывается раньше изоляции: меню обрабатывает навигацию здесь. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	panelRef?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element;
}

/**
 * Плавающая панель: показ в top layer и стек слоёв, позиционирование, хост, изоляция событий, фокус (спек этапа 2, раздел 3).
 * Класс из `class` должен подключать `panel` (и `material`) из panel-base.module.css через composes.
 */
export function FloatingPanel(props: FloatingPanelProps): JSX.Element {
	const [local, rest] = splitProps(props, [
		'open',
		'onDismiss',
		'anchor',
		'anchorElement',
		'dismissExempt',
		'restoreFocusTo',
		'placement',
		'gap',
		'matchAnchorWidth',
		'size',
		'initialFocus',
		'onKeyDown',
		'panelRef',
		'class',
		'style',
		'children'
	]);
	const [panel, setPanel] = createSignal<HTMLDivElement>();

	const anchorElement = (): Element | undefined => {
		const explicit = local.anchorElement?.();
		if (explicit) {
			return explicit;
		}
		const anchor = local.anchor();
		return anchor instanceof Element ? anchor : undefined;
	};

	const open = (): boolean => local.open();

	createAnchoredPosition({
		anchor: () => local.anchor(),
		floating: panel,
		open,
		get placement() {
			return local.placement;
		},
		get gap() {
			return local.gap;
		},
		get matchAnchorWidth() {
			return local.matchAnchorWidth;
		}
	});
	createPanelLayer({
		panel,
		anchor: () => (local.dismissExempt ? local.dismissExempt() : anchorElement()),
		open,
		onDismiss: () => {
			local.onDismiss();
		}
	});
	createFocusOnOpen({ panel, open, mode: () => local.initialFocus ?? 'first' });
	createFocusRestore({ panel, anchor: () => (local.restoreFocusTo ? local.restoreFocusTo() : anchorElement()), open });

	return (
		<Show when={local.open()}>
			<PanelPortal anchor={anchorElement}>
				<div
					{...rest}
					{...isolationHandlers}
					ref={(element) => {
						setPanel(element);
						local.panelRef?.(element);
					}}
					data-s-kit
					data-s-kit-size={local.size}
					class={local.class}
					style={local.style}
					onKeyDown={(event) => {
						local.onKeyDown?.(event);
						if (blocksImplicitSubmit(event, event.currentTarget)) {
							event.preventDefault();
						}
						event.stopPropagation();
					}}
				>
					{local.children}
				</div>
			</PanelPortal>
		</Show>
	);
}
