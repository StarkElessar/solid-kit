import { createEffect, createMemo, createSignal, type JSX, on } from 'solid-js';

import type { ActiveSource } from '../../internal/list-box/create-list-box-controller';
import { createListBoxOwner } from '../../internal/list-box/create-list-box-owner';
import { filterItems, type ItemFilter } from '../../internal/list-box/filter-items';
import type { ListKey } from '../../internal/list-box/list-row';
import { createControllableSignal } from '../../utils/create-controllable-signal';

import { type ChipsOverflow, MultiSelectContext, type MultiSelectContextValue, type MultiSelectSize } from './multiselect-context';
import {
	isAllChecked,
	isAllValue,
	type MultiSelectValue,
	selectedCount,
	toggleAll,
	toggleItem,
	valueItems
} from './multiselect-value';

export interface MultiSelectRootProps<T> {
	items: readonly T[];
	/** Стабильный ключ элемента: выбор, подсветка и `id` опций строятся по нему. */
	getKey: (item: T) => ListKey;
	getLabel: (item: T) => string;
	/** Название группы: опции собираются в группы с заголовком в порядке первого появления названия. */
	groupBy?: ((item: T) => string) | undefined;
	isItemDisabled?: ((item: T) => boolean) | undefined;
	/** Выбранные элементы в порядке выбора либо `allKey`, если выбрано «Все». */
	value?: MultiSelectValue<T> | undefined;
	/** По умолчанию пустой массив. */
	defaultValue?: MultiSelectValue<T> | undefined;
	onValueChange?: ((value: MultiSelectValue<T>) => void) | undefined;
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** Текст в поле поиска. */
	query?: string | undefined;
	defaultQuery?: string | undefined;
	onQueryChange?: ((query: string) => void) | undefined;
	/** Клиентский фильтр, по умолчанию подпись содержит запрос без учёта регистра; `false`: список приходит отфильтрованным снаружи. */
	filter?: ItemFilter<T> | false | undefined;
	loading?: boolean | undefined;
	/** По умолчанию `true`; читается один раз при создании корня. */
	virtualized?: boolean | undefined;
	/** Сколько строк рендерить за пределами видимой области, по умолчанию 6; читается один раз. */
	overscan?: number | undefined;
	disabled?: boolean | undefined;
	/** Размер триггера и строк списка. */
	size?: MultiSelectSize | undefined;
	/** «из M» в счётчике; без него число элементов `items`. */
	total?: number | undefined;
	/** Ключ строки «Все» (например `-1`); строка появляется вместе с `allLabel`. Значение при выбранном «Все» равно этому ключу. */
	allKey?: ListKey | undefined;
	/** Подпись строки «Все» и её чипа. */
	allLabel?: JSX.Element;
	/** Переполнение чипов, по умолчанию `'collapse'`. */
	chipsOverflow?: ChipsOverflow | undefined;
	children?: JSX.Element;
}

const NO_ITEMS: readonly never[] = [];

export function MultiSelectRoot<T>(props: MultiSelectRootProps<T>): JSX.Element {
	const [open, setOpenRaw] = createControllableSignal<boolean>({
		name: 'MultiSelect',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [value, setValue] = createControllableSignal<MultiSelectValue<T>>({
		name: 'MultiSelect',
		value: () => props.value,
		defaultValue: () => props.defaultValue ?? NO_ITEMS,
		onChange: (next) => props.onValueChange?.(next)
	});
	const [query, setQuery] = createControllableSignal<string>({
		name: 'MultiSelect',
		value: () => props.query,
		defaultValue: () => props.defaultQuery ?? '',
		onChange: (next) => props.onQueryChange?.(next)
	});
	const [anchor, setAnchor] = createSignal<HTMLElement>();
	const [input, setInput] = createSignal<HTMLInputElement>();

	const getLabel = (item: T): string => props.getLabel(item);
	const valueContext = (): { getKey: (item: T) => ListKey; allKey: ListKey | undefined } => ({
		getKey: (item) => props.getKey(item),
		allKey: props.allKey
	});
	const isDisabled = (item: T): boolean => props.isItemDisabled?.(item) ?? false;
	const allRowEnabled = (): boolean => props.allKey !== undefined && props.allLabel !== undefined;

	const isAll = createMemo(() => isAllValue(value(), props.allKey));
	const total = (): number => props.total ?? props.items.length;
	const count = createMemo(() => selectedCount(value(), props.allKey, total()));
	const visibleItems = createMemo(() => filterItems(props.items, query(), props.filter, getLabel));
	const filtered = (): boolean => query() !== '';
	const allChecked = createMemo(() => isAllChecked(value(), visibleItems(), valueContext(), isDisabled));

	const selectedKeys = createMemo(() => {
		const keys = new Set<ListKey>();
		if (isAll()) {
			for (const item of props.items) {
				keys.add(props.getKey(item));
			}
		}
		else {
			for (const item of valueItems(value())) {
				keys.add(props.getKey(item));
			}
		}
		if (allRowEnabled() && allChecked() && props.allKey !== undefined) {
			keys.add(props.allKey);
		}
		return keys;
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
		get allKey() {
			return allRowEnabled() ? props.allKey : undefined;
		},
		open,
		anchor,
		selectedKeys,
		onActivate: (item) => {
			setValue(toggleItem(value(), item, props.items, valueContext()));
		},
		onActivateAll: () => {
			setValue(toggleAll(value(), {
				...valueContext(),
				items: props.items,
				shown: visibleItems(),
				filtered: filtered(),
				checked: allChecked(),
				isItemDisabled: props.isItemDisabled
			}));
		},
		get virtualized() {
			return props.virtualized;
		},
		get overscan() {
			return props.overscan;
		},
		keys: { typeahead: false, space: false, homeEnd: false }
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

	// запрос живёт, пока список открыт
	createEffect(on(open, (isOpen) => {
		if (!isOpen && query() !== '') {
			setQuery('');
		}
	}, { defer: true }));

	const context: MultiSelectContextValue = {
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
		isAll,
		selectedItems: () => valueItems(value()),
		count,
		total,
		getKey: (item) => props.getKey(item as T),
		getLabel: (item) => props.getLabel(item as T),
		removeItem: (item) => {
			const key = props.getKey(item as T);
			setValue(valueItems(value()).filter((candidate) => props.getKey(candidate) !== key));
		},
		clearAll: () => {
			setValue(NO_ITEMS);
		},
		allLabel: () => props.allLabel ?? 'Все',
		chipsOverflow: () => props.chipsOverflow ?? 'collapse',
		query,
		handleInput: (text) => {
			setQuery(text);
			if (open()) {
				owner.controller.resetActive('keyboard', { ignoreSelected: true });
			}
			else {
				setOpen(true, 'keyboard');
			}
		},
		rows: owner.rows,
		controller: owner.controller,
		window: owner.window,
		setScroller: owner.setScroller,
		loading: () => props.loading ?? false,
		disabled: () => props.disabled ?? false,
		size: () => props.size
	};

	return <MultiSelectContext.Provider value={context}>{props.children}</MultiSelectContext.Provider>;
}
