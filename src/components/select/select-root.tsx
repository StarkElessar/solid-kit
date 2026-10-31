import { createComputed, createEffect, createMemo, createSignal, createUniqueId, type JSX, on, untrack } from 'solid-js';

import { type ActiveSource, createListBoxController } from '../../internal/list-box/create-list-box-controller';
import { flattenRows } from '../../internal/list-box/flatten-rows';
import type { ListKey } from '../../internal/list-box/list-row';
import { createControllableSignal } from '../../utils/create-controllable-signal';
import { createFullWindow } from '../../utils/create-full-window';
import { createVirtualWindow } from '../../utils/create-virtual-window';
import { readControlHeight } from '../../utils/read-control-height';
import { readTokenPx } from '../../utils/read-token-px';
import type { RenderWindowOptions } from '../../utils/render-window';

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

const FALLBACK_ESTIMATE = 32;
const FALLBACK_MAX_HEIGHT = 320;
const NO_KEYS: ReadonlySet<ListKey> = new Set();

export function SelectRoot<T>(props: SelectRootProps<T>): JSX.Element {
	const listId = `${createUniqueId()}-select-list`;
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
	const [scroller, setScroller] = createSignal<HTMLElement>();
	const [openSource, setOpenSource] = createSignal<ActiveSource>('keyboard');

	const rows = createMemo(() => flattenRows(props.items, {
		getKey: props.getKey,
		getLabel: props.getLabel,
		groupBy: props.groupBy,
		isItemDisabled: props.isItemDisabled
	}));
	const hasGroups = createMemo(() => rows().some((row) => row.kind === 'group'));
	const selectedKeys = createMemo(() => {
		const current = value();
		return current === null ? NO_KEYS : new Set<ListKey>([props.getKey(current)]);
	});

	// оценка высоты строки и предельная высота списка читаются с триггера один раз за открытие
	const estimate = createMemo(() => {
		const trigger = anchor();
		return open() && trigger ? readControlHeight(trigger) : FALLBACK_ESTIMATE;
	});
	const maxHeight = createMemo(() => {
		const trigger = anchor();
		return open() && trigger ? readTokenPx(trigger, ['--s-kit-listbox-max-height'], FALLBACK_MAX_HEIGHT) : FALLBACK_MAX_HEIGHT;
	});

	const windowOptions: RenderWindowOptions = {
		// закрытый список не держит измерений: оценка читается при открытии, до них
		count: () => (open() ? rows().length : 0),
		scroller,
		estimateSize: () => estimate(),
		overscan: untrack(() => props.overscan) ?? 6,
		scrollPaddingStart: () => (hasGroups() ? estimate() : 0),
		initialHeight: () => Math.min(maxHeight(), rows().length * estimate())
	};
	const window = untrack(() => props.virtualized) === false ? createFullWindow(windowOptions) : createVirtualWindow(windowOptions);

	const setOpen = (next: boolean, source: ActiveSource = 'keyboard'): void => {
		if (next === open()) {
			return;
		}
		if (next) {
			setOpenSource(source);
		}
		setOpenRaw(next);
	};

	const controller = createListBoxController<T>({
		listId,
		rows,
		selectedKeys,
		onActivate: (item) => {
			const current = value();
			if (current === null || props.getKey(current) !== props.getKey(item)) {
				setValue(item);
			}
			setOpenRaw(false);
		},
		window,
		pageSize: () => {
			const element = scroller();
			return element ? Math.max(Math.floor(element.clientHeight / estimate()), 1) : 10;
		}
	});

	// подсветка и прокрутка к выбранному: скроллер появляется вместе с открытым списком
	createEffect(on(scroller, (element) => {
		if (element) {
			controller.resetActive(untrack(openSource));
		}
	}));
	createComputed(on(open, (isOpen) => {
		if (!isOpen) {
			controller.clearActive();
		}
	}, { defer: true }));

	const context: SelectContextValue = {
		listId,
		open,
		setOpen,
		anchor,
		setAnchor: (element) => {
			setAnchor(element);
		},
		value,
		getLabel: (item) => props.getLabel(item as T),
		rows,
		controller,
		window,
		setScroller: (element) => {
			setScroller(element);
		},
		loading: () => props.loading ?? false,
		disabled: () => props.disabled ?? false,
		size: () => props.size
	};

	return <SelectContext.Provider value={context}>{props.children}</SelectContext.Provider>;
}
