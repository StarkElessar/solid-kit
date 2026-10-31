import styles from './multiselect.module.css';

import { type JSX, Show } from 'solid-js';

import type { ListBoxProps } from '../../internal/list-box/list-box';
import { ListBoxPanel } from '../../internal/list-box/list-box-panel';
import { Input } from '../input';

import { useMultiSelectContext } from './multiselect-context';

export interface MultiSelectContentProps<T> {
	renderOption?: ListBoxProps<T>['renderOption'];
	renderGroupHeader?: ListBoxProps<T>['renderGroupHeader'];
	/** По умолчанию «Загрузка…». */
	loadingText?: JSX.Element;
	/** По умолчанию «Нет элементов для отображения». */
	emptyText?: JSX.Element;
	searchPlaceholder?: string | undefined;
	/** Доступное имя поля поиска; по умолчанию «Поиск». */
	searchLabel?: string | undefined;
	/** Корневой элемент панели. */
	ref?: ((element: HTMLDivElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function MultiSelectContent<T>(props: MultiSelectContentProps<T>): JSX.Element {
	const context = useMultiSelectContext('MultiSelect.Content');
	const close = (): void => {
		context.setOpen(false);
	};

	return (
		<ListBoxPanel
			open={context.open}
			onDismiss={close}
			anchor={context.anchor}
			restoreFocusTo={context.trigger}
			initialFocus={context.searchable() ? 'first' : 'none'}
			size={context.size()}
			listId={context.listId}
			controller={context.controller}
			rows={context.rows}
			window={context.window}
			setScroller={context.setScroller}
			multiple
			allLabel={context.allLabel()}
			loading={context.loading()}
			loadingText={props.loadingText}
			emptyText={props.emptyText}
			renderOption={props.renderOption as ListBoxProps<unknown>['renderOption']}
			renderGroupHeader={props.renderGroupHeader}
			panelRef={props.ref}
			class={props.class ? `${styles['content']} ${props.class}` : styles['content']}
			style={props.style}
			header={(
				<Show when={context.searchable()}>
					<div class={styles['search']}>
						<Input
							role='combobox'
							autocomplete='off'
							aria-autocomplete='list'
							aria-expanded={true}
							aria-controls={context.listId}
							aria-activedescendant={context.controller.activeId()}
							aria-label={props.searchLabel ?? 'Поиск'}
							placeholder={props.searchPlaceholder}
							size={context.size()}
							value={context.query()}
							onValueChange={context.handleSearch}
							onKeyDown={(event) => {
								if (event.key === 'Tab') {
									event.preventDefault();
									close();
									return;
								}
								if (context.controller.handleKeyDown(event)) {
									event.preventDefault();
								}
							}}
						/>
					</div>
				</Show>
			)}
		/>
	);
}
