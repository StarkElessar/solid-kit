import { createMemo, createSignal, type JSX } from 'solid-js';

import type { ActiveSource } from '../../internal/list-box/create-list-box-controller';
import { createListBoxOwner } from '../../internal/list-box/create-list-box-owner';
import type { ListKey } from '../../internal/list-box/list-row';
import { createControllableSignal } from '../../utils/create-controllable-signal';

import { SelectContext, type SelectContextValue, type SelectSize } from './select-context';

export interface SelectRootProps<T> {
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
	loading?: boolean | undefined;
	/** По умолчанию `true`; читается один раз при создании корня. */
	virtualized?: boolean | undefined;
	/** Сколько строк рендерить за пределами видимой области, по умолчанию 6; читается один раз. */
	overscan?: number | undefined;
	disabled?: boolean | undefined;
	/** Размер триггера и строк списка. */
	size?: SelectSize | undefined;
	children?: JSX.Element;
}

const NO_KEYS: ReadonlySet<ListKey> = new Set();

export function SelectRoot<T>(props: SelectRootProps<T>): JSX.Element {
	const [open, setOpenRaw] = createControllableSignal<boolean>({
		name: 'Select',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [value, setValue] = createControllableSignal<T | null>({
		name: 'Select',
		value: () => props.value,
		defaultValue: () => props.defaultValue ?? null,
		onChange: (next) => props.onValueChange?.(next)
	});
	const [anchor, setAnchor] = createSignal<HTMLElement>();

	const selectedKeys = createMemo(() => {
		const current = value();
		return current === null ? NO_KEYS : new Set<ListKey>([props.getKey(current)]);
	});

	const owner = createListBoxOwner<T>({
		get items() {
			return props.items;
		},
		getKey: (item) => props.getKey(item),
		getLabel: (item) => props.getLabel(item),
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
			if (current === null || props.getKey(current) !== props.getKey(item)) {
				setValue(item);
			}
			setOpenRaw(false);
		},
		get virtualized() {
			return props.virtualized;
		},
		get overscan() {
			return props.overscan;
		}
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

	const context: SelectContextValue = {
		listId: owner.listId,
		open,
		setOpen,
		anchor,
		setAnchor: (element) => {
			setAnchor(element);
		},
		value,
		getLabel: (item) => props.getLabel(item as T),
		rows: owner.rows,
		controller: owner.controller,
		window: owner.window,
		setScroller: owner.setScroller,
		loading: () => props.loading ?? false,
		disabled: () => props.disabled ?? false,
		size: () => props.size
	};

	return <SelectContext.Provider value={context}>{props.children}</SelectContext.Provider>;
}
