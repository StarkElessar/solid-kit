import { createEffect, createMemo, createSignal, type JSX, on, untrack } from 'solid-js';

import type { ActiveSource } from '../../internal/list-box/create-list-box-controller';
import { createListBoxOwner } from '../../internal/list-box/create-list-box-owner';
import { filterItems, type ItemFilter } from '../../internal/list-box/filter-items';
import type { ListKey } from '../../internal/list-box/list-row';
import { createControllableSignal } from '../../utils/create-controllable-signal';

import { ComboboxContext, type ComboboxContextValue, type ComboboxSize } from './combobox-context';
import type { ComboboxQueryReason } from './combobox-query-reason';

export interface ComboboxRootProps<T> {
	items: readonly T[];
	/** Стабильный ключ элемента: выбор, подсветка и `id` опций строятся по нему. */
	getKey: (item: T) => ListKey;
	getLabel: (item: T) => string;
	/** Название группы: опции собираются в группы с заголовком в порядке первого появления названия. */
	groupBy?: ((item: T) => string) | undefined;
	isItemDisabled?: ((item: T) => boolean) | undefined;
	value?: T | null | undefined;
	/** По умолчанию `null`. */
	defaultValue?: T | null | undefined;
	onValueChange?: ((value: T | null) => void) | undefined;
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** Текст в поле. */
	query?: string | undefined;
	/** По умолчанию подпись значения или пустая строка. */
	defaultQuery?: string | undefined;
	/** `reason === 'input'`: печатает пользователь; `'reset'`: текст вернулся к подписи значения. */
	onQueryChange?: ((query: string, reason: ComboboxQueryReason) => void) | undefined;
	/**
	 * Клиентский фильтр, по умолчанию подпись содержит запрос без учёта регистра; `false`: список приходит отфильтрованным
	 * снаружи (внешний поиск). Пока пользователь не печатал, список показывается целиком.
	 */
	filter?: ItemFilter<T> | false | undefined;
	loading?: boolean | undefined;
	/** По умолчанию `true`; читается один раз при создании корня. */
	virtualized?: boolean | undefined;
	/** Сколько строк рендерить за пределами видимой области, по умолчанию 6; читается один раз. */
	overscan?: number | undefined;
	disabled?: boolean | undefined;
	/** Размер поля и строк списка. */
	size?: ComboboxSize | undefined;
	children?: JSX.Element;
}

const NO_KEYS: ReadonlySet<ListKey> = new Set();

export function ComboboxRoot<T>(props: ComboboxRootProps<T>): JSX.Element {
	const [open, setOpenRaw] = createControllableSignal<boolean>({
		name: 'Combobox',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [value, setValue] = createControllableSignal<T | null>({
		name: 'Combobox',
		value: () => props.value,
		defaultValue: () => props.defaultValue ?? null,
		onChange: (next) => props.onValueChange?.(next)
	});
	const getLabel = (item: T): string => props.getLabel(item);
	const labelOf = (item: T | null): string => (item === null ? '' : getLabel(item));

	let queryReason: ComboboxQueryReason = 'input';
	const [query, setQueryRaw] = createControllableSignal<string>({
		name: 'Combobox',
		value: () => props.query,
		defaultValue: () => untrack(() => props.defaultQuery ?? labelOf(value())),
		onChange: (next) => props.onQueryChange?.(next, queryReason)
	});
	const setQuery = (text: string, reason: ComboboxQueryReason): void => {
		queryReason = reason;
		setQueryRaw(text);
	};
	const resetQuery = (): void => {
		const label = labelOf(value());
		if (query() !== label) {
			setQuery(label, 'reset');
		}
	};

	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [input, setInput] = createSignal<HTMLInputElement>();
	const [typed, setTyped] = createSignal(false);

	const visibleItems = createMemo(() => filterItems(props.items, typed() ? query() : '', props.filter, getLabel));
	const selectedKeys = createMemo(() => {
		const current = value();
		return current === null ? NO_KEYS : new Set<ListKey>([props.getKey(current)]);
	});

	const owner = createListBoxOwner<T>({
		get items() {
			return visibleItems();
		},
		getKey: (item) => props.getKey(item),
		getLabel,
		get groupBy() {
			return props.groupBy;
		},
		get isItemDisabled() {
			return props.isItemDisabled;
		},
		open,
		anchor,
		selectedKeys,
		onActivate: (item) => {
			const current = value();
			setTyped(false);
			if (current === null || props.getKey(current) !== props.getKey(item)) {
				setValue(item);
			}
			resetQuery();
			setOpenRaw(false);
		},
		get virtualized() {
			return props.virtualized;
		},
		get overscan() {
			return props.overscan;
		},
		keys: { typeahead: false, space: false, homeEnd: false },
		ignoreSelectedOnReset: typed
	});

	const setOpen = (next: boolean, source: ActiveSource = 'keyboard'): void => {
		if (next === open()) {
			return;
		}
		if (next) {
			owner.setOpenSource(source);
		}
		setOpenRaw(next);
	};

	// внешняя смена значения возвращает в поле его подпись, если пользователь не печатает
	createEffect(on(value, () => {
		if (!typed()) {
			resetQuery();
		}
	}, { defer: true }));

	const context: ComboboxContextValue = {
		listId: owner.listId,
		open,
		setOpen,
		anchor,
		setAnchor: (element) => {
			setAnchor(element);
		},
		input,
		setInput: (element) => {
			setInput(element);
		},
		query,
		handleInput: (text) => {
			setTyped(true);
			setQuery(text, 'input');
			if (open()) {
				owner.controller.resetActive('keyboard', { ignoreSelected: true });
			}
			else {
				setOpen(true, 'keyboard');
			}
		},
		handleBlur: () => {
			setTyped(false);
			setOpenRaw(false);
			if (query() === '' && value() !== null) {
				setValue(null);
			}
			resetQuery();
		},
		rows: owner.rows,
		controller: owner.controller,
		window: owner.window,
		setScroller: owner.setScroller,
		loading: () => props.loading ?? false,
		disabled: () => props.disabled ?? false,
		size: () => props.size
	};

	return <ComboboxContext.Provider value={context}>{props.children}</ComboboxContext.Provider>;
}
