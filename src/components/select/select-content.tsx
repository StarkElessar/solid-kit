import styles from './select.module.css';

import type { JSX } from 'solid-js';

import type { ListBoxProps } from '../../internal/list-box/list-box';
import { ListBoxPanel } from '../../internal/list-box/list-box-panel';

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
		<ListBoxPanel
			open={context.open}
			onDismiss={close}
			anchor={context.anchor}
			size={context.size()}
			listId={context.listId}
			controller={context.controller}
			rows={context.rows}
			window={context.window}
			setScroller={context.setScroller}
			loading={context.loading()}
			loadingText={props.loadingText}
			emptyText={props.emptyText}
			renderOption={props.renderOption as ListBoxProps<unknown>['renderOption']}
			renderGroupHeader={props.renderGroupHeader}
			panelRef={props.ref}
			class={props.class ? `${styles['content']} ${props.class}` : styles['content']}
			style={props.style}
		/>
	);
}
