import styles from './select.module.css';

import type { JSX } from 'solid-js';

import { FloatingPanel } from '../../internal/floating-panel/floating-panel';
import { ListBox, type ListBoxProps } from '../../internal/list-box/list-box';

import { useSelectContext } from './select-context';

export interface SelectContentProps<T> {
	renderOption?: ListBoxProps<T>['renderOption'];
	renderGroupHeader?: ListBoxProps<T>['renderGroupHeader'];
	/** По умолчанию «Загрузка…». */
	loadingText?: JSX.Element;
	/** По умолчанию «Нет элементов для отображения». */
	emptyText?: JSX.Element;
	/** Корневой элемент панели. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function SelectContent<T>(props: SelectContentProps<T>): JSX.Element {
	const context = useSelectContext('Select.Content');
	const close = (): void => {
		context.setOpen(false);
	};

	return (
		<FloatingPanel
			open={context.open}
			onDismiss={close}
			anchor={context.anchor}
			placement='bottom-start'
			gap={4}
			matchAnchorWidth
			// фокус остаётся на кнопке: подсветка опций идёт через aria-activedescendant
			initialFocus='none'
			size={context.size()}
			panelRef={props.ref}
			class={props.class ? `${styles['content']} ${props.class}` : styles['content']}
			style={props.style}
		>
			<ListBox
				listId={context.listId}
				controller={context.controller}
				rows={context.rows}
				window={context.window}
				scrollerRef={context.setScroller}
				loading={context.loading()}
				loadingText={props.loadingText}
				emptyText={props.emptyText}
				renderOption={props.renderOption as ListBoxProps<unknown>['renderOption']}
				renderGroupHeader={props.renderGroupHeader}
			/>
		</FloatingPanel>
	);
}
