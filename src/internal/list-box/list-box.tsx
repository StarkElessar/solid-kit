import styles from './list-box.module.css';

import { type Accessor, createMemo, createSignal, For, type JSX, Match, onCleanup, onMount, Show, Switch } from 'solid-js';

import type { RenderWindow } from '../../utils/render-window';

import type { ListBoxController } from './create-list-box-controller';
import { ListBoxAllOption } from './list-box-all-option';
import { ListBoxGroupHeader } from './list-box-group-header';
import { ListBoxOption, type OptionState } from './list-box-option';
import type { ListAllRow, ListGroupRow, ListOptionRow, ListRow } from './list-row';

export interface ListBoxProps<T> {
	listId: string;
	controller: ListBoxController;
	rows: Accessor<readonly ListRow<T>[]>;
	window: RenderWindow;
	/** Получает скроллер после вставки в документ и `undefined` при удалении. */
	scrollerRef: (element: HTMLElement | undefined) => void;
	multiple?: boolean | undefined;
	loading?: boolean | undefined;
	loadingText?: JSX.Element;
	emptyText?: JSX.Element;
	renderOption?: ((item: T, state: OptionState) => JSX.Element) | undefined;
	renderGroupHeader?: ((label: string) => JSX.Element) | undefined;
	/** Подпись строки «Все» (строка есть в `rows`, если её добавил владелец списка). */
	allLabel?: JSX.Element;
}

function asOption<T>(row: ListRow<T> | undefined): ListOptionRow<T> | undefined {
	return row?.kind === 'option' ? row : undefined;
}

function asAll<T>(row: ListRow<T> | undefined): ListAllRow | undefined {
	return row?.kind === 'all' ? row : undefined;
}

function asGroup<T>(row: ListRow<T> | undefined): ListGroupRow | undefined {
	return row?.kind === 'group' ? row : undefined;
}

/**
 * Разметка списка (спек этапа 3, раздел 5.3): скроллер `role="listbox"` со строками окна рендера между двумя spacer-элементами.
 * Фокус остаётся у владельца списка, подсветка активной опции это `[data-active]`.
 */
export function ListBox<T>(props: ListBoxProps<T>): JSX.Element {
	const [scrollTop, setScrollTop] = createSignal(0);
	const items = (): ReturnType<RenderWindow['items']> => props.window.items();
	const optionCount = createMemo(() => props.rows().reduce((count, row) => (row.kind === 'option' ? count + 1 : count), 0));
	const groupLabels = createMemo(() => {
		const labels = new Map<number, string>();
		for (const row of props.rows()) {
			if (row.kind === 'group') {
				labels.set(row.groupIndex, row.label);
			}
		}
		return labels;
	});

	const topSpace = (): number => items()[0]?.start ?? 0;
	const bottomSpace = (): number => {
		const all = items();
		const last = all[all.length - 1];
		return last ? Math.max(props.window.totalSize() - (last.start + last.size), 0) : 0;
	};

	// группа первой видимой строки; если видна строка самого заголовка, липкий не дублирует её
	const stickyLabel = createMemo(() => {
		if (groupLabels().size === 0) {
			return undefined;
		}
		const top = scrollTop();
		const first = items().find((item) => item.start + item.size > top);
		const row = first === undefined ? undefined : props.rows()[first.index];
		return row?.kind === 'option' ? groupLabels().get(row.groupIndex) : undefined;
	});

	// скроллер отдаётся владельцу после вставки в документ: виртуализатор, получивший ещё не вставленный элемент,
	// пропускает его прокрутку (проверено на virtual-core 3.19.8)
	let scroller: HTMLDivElement | undefined;
	onMount(() => {
		props.scrollerRef(scroller);
	});
	onCleanup(() => {
		props.scrollerRef(undefined);
	});

	return (
		<div
			ref={scroller}
			id={props.listId}
			role='listbox'
			aria-multiselectable={props.multiple ? true : undefined}
			data-s-kit-focus-inset
			data-active-source={props.controller.activeSource()}
			class={styles['scroller']}
			onScroll={(event) => {
				setScrollTop(event.currentTarget.scrollTop);
			}}
			// фокус остаётся у владельца списка
			onMouseDown={(event) => {
				event.preventDefault();
			}}
		>
			<Show when={!props.loading} fallback={<div role='status' class={styles['message']}>{props.loadingText ?? 'Загрузка…'}</div>}>
				<Show
					when={props.rows().length > 0}
					fallback={<div class={styles['message']}>{props.emptyText ?? 'Нет элементов для отображения'}</div>}
				>
					<Show when={stickyLabel()}>
						{(label) => (
							<div class={styles['sticky-wrap']} data-list-box-sticky>
								<div class={`${styles['group']} ${styles['sticky']}`} aria-hidden='true'>
									{props.renderGroupHeader ? props.renderGroupHeader(label()) : label()}
								</div>
							</div>
						)}
					</Show>
					<div aria-hidden='true' style={{ 'block-size': `${topSpace()}px` }}/>
					<For each={items()}>
						{(item) => {
							const row = (): ListRow<T> | undefined => props.rows()[item.index];
							return (
								<Switch>
									<Match when={asOption(row())}>
										{(option) => (
											<ListBoxOption
												listId={props.listId}
												row={option}
												index={item.index}
												setSize={optionCount}
												controller={props.controller}
												measure={props.window.measure}
												renderOption={props.renderOption}
											/>
										)}
									</Match>
									<Match when={asAll(row())}>
										{(all) => (
											<ListBoxAllOption
												listId={props.listId}
												row={all()}
												index={item.index}
												controller={props.controller}
												measure={props.window.measure}
												label={props.allLabel ?? 'Все'}
											/>
										)}
									</Match>
									<Match when={asGroup(row())}>
										{(group) => (
											<ListBoxGroupHeader
												row={group()}
												index={item.index}
												measure={props.window.measure}
												renderGroupHeader={props.renderGroupHeader}
											/>
										)}
									</Match>
								</Switch>
							);
						}}
					</For>
					<div aria-hidden='true' style={{ 'block-size': `${bottomSpace()}px` }}/>
				</Show>
			</Show>
		</div>
	);
}
