import styles from './popover.module.css';

import { type JSX, splitProps } from 'solid-js';

import { FloatingPanel, type FloatingPanelAttributes } from '../../internal/floating-panel/floating-panel';
import { renderChildren } from '../../internal/render-children';

import { usePopoverContext } from './popover-context';
import type { PopoverState } from './popover-state';

export interface PopoverContentProps extends FloatingPanelAttributes {
	/** Вызывается раньше изоляции события; остальные изолируемые события (`onClick`, `onInput` и др.) вешаются на элементы внутри. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDivElement }) => void) | undefined;
	/** Корневой элемент панели. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	matchAnchorWidth?: boolean | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element | ((state: PopoverState) => JSX.Element);
}

export function PopoverContent(props: PopoverContentProps): JSX.Element {
	const context = usePopoverContext('Popover.Content');
	const [local, rest] = splitProps(props, ['size', 'matchAnchorWidth', 'class', 'style', 'children', 'ref', 'onKeyDown']);
	const state: PopoverState = {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};

	return (
		<FloatingPanel
			{...rest}
			id={context.contentId}
			data-s-kit-popover-content
			open={context.open}
			onDismiss={state.close}
			anchor={context.anchor}
			placement={context.placement()}
			gap={context.gap()}
			matchAnchorWidth={local.matchAnchorWidth}
			onKeyDown={local.onKeyDown}
			panelRef={local.ref}
			size={local.size}
			class={local.class ? `${styles['content']} ${local.class}` : styles['content']}
			style={local.style}
		>
			{renderChildren(local.children, state)}
		</FloatingPanel>
	);
}
