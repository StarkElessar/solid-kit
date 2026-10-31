import styles from './list-box-panel.module.css';

import type { Accessor, JSX } from 'solid-js';

import type { RenderWindow } from '../../utils/render-window';
import { FloatingPanel } from '../floating-panel/floating-panel';

import type { ListBoxController } from './create-list-box-controller';
import { ListBox, type ListBoxProps } from './list-box';
import type { ListRow } from './list-row';

export interface ListBoxPanelProps<T> {
	open: Accessor<boolean>;
	onDismiss: () => void;
	anchor: Accessor<HTMLElement | undefined>;
	/** Кому вернуть фокус, если он потерялся при закрытии; по умолчанию якорь. */
	restoreFocusTo?: Accessor<Element | undefined> | undefined;
	size?: 'sm' | 'md' | 'lg' | undefined;
	listId: string;
	controller: ListBoxController;
	rows: Accessor<readonly ListRow<T>[]>;
	window: RenderWindow;
	setScroller: (element: HTMLElement | undefined) => void;
	multiple?: boolean | undefined;
	loading?: boolean | undefined;
	loadingText?: JSX.Element;
	emptyText?: JSX.Element;
	renderOption?: ListBoxProps<T>['renderOption'];
	renderGroupHeader?: ListBoxProps<T>['renderGroupHeader'];
	/** Корневой элемент панели. */
	panelRef?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

/**
 * Панель выпадающего списка: `FloatingPanel` по ширине якоря с `ListBox` внутри. Фокус остаётся у владельца списка,
 * подсветка опций идёт через `aria-activedescendant`.
 */
export function ListBoxPanel<T>(props: ListBoxPanelProps<T>): JSX.Element {
	return (
		<FloatingPanel
			open={props.open}
			onDismiss={props.onDismiss}
			anchor={props.anchor}
			restoreFocusTo={props.restoreFocusTo}
			placement='bottom-start'
			gap={4}
			matchAnchorWidth
			initialFocus='none'
			size={props.size}
			panelRef={props.panelRef}
			class={props.class ? `${styles['panel']} ${props.class}` : styles['panel']}
			style={props.style}
		>
			<ListBox
				listId={props.listId}
				controller={props.controller}
				rows={props.rows}
				window={props.window}
				scrollerRef={props.setScroller}
				multiple={props.multiple}
				loading={props.loading}
				loadingText={props.loadingText}
				emptyText={props.emptyText}
				renderOption={props.renderOption}
				renderGroupHeader={props.renderGroupHeader}
			/>
		</FloatingPanel>
	);
}
