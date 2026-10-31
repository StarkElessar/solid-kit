import { type Accessor, createComputed, createEffect, createMemo, createSignal, createUniqueId, on, untrack } from 'solid-js';

import { createFullWindow } from '../../utils/create-full-window';
import { createVirtualWindow } from '../../utils/create-virtual-window';
import { readControlHeight } from '../../utils/read-control-height';
import { readTokenPx } from '../../utils/read-token-px';
import type { RenderWindow, RenderWindowOptions } from '../../utils/render-window';

import {
	type ActiveSource,
	createListBoxController,
	type ListBoxController,
	type ListBoxControllerOptions
} from './create-list-box-controller';
import { flattenRows } from './flatten-rows';
import type { ListKey, ListRow } from './list-row';

export interface ListBoxOwnerOptions<T> {
	/** Уже отфильтрованные элементы. */
	items: readonly T[];
	getKey: (item: T) => ListKey;
	getLabel: (item: T) => string;
	groupBy: ((item: T) => string) | undefined;
	isItemDisabled: ((item: T) => boolean) | undefined;
	open: Accessor<boolean>;
	/** Элемент, с которого читаются высота строки и токены списка; пока `undefined`, берутся запасные значения. */
	anchor: Accessor<HTMLElement | undefined>;
	selectedKeys: Accessor<ReadonlySet<ListKey>>;
	onActivate: (item: T) => void;
	/** Ключ строки «Все» (MultiSelect): если задан и есть опции, она идёт первой. */
	allKey?: ListKey | undefined;
	onActivateAll?: (() => void) | undefined;
	/** Читается один раз; по умолчанию `true`. */
	virtualized: boolean | undefined;
	/** Читается один раз; по умолчанию 6. */
	overscan: number | undefined;
	keys?: ListBoxControllerOptions<T>['keys'];
	/** При появлении скроллера подсвечивать первую доступную строку, а не выбранную. */
	ignoreSelectedOnReset?: Accessor<boolean> | undefined;
}

export interface ListBoxOwner<T> {
	/** Основа `id` опций и значение `aria-controls` владельца. */
	listId: string;
	rows: Accessor<readonly ListRow<T>[]>;
	controller: ListBoxController;
	window: RenderWindow;
	setScroller: (element: HTMLElement | undefined) => void;
	/** От источника открытия зависит, рисуется ли кольцо фокуса на активной опции. */
	setOpenSource: (source: ActiveSource) => void;
}

const FALLBACK_ESTIMATE = 32;
const FALLBACK_MAX_HEIGHT = 320;
const FALLBACK_PADDING = 4;

/**
 * Состояние списка без разметки владельца (Select, Combobox, MultiSelect): плоские строки, окно рендера, контроллер и эффекты
 * открытия и закрытия. Владелец отвечает за значение, открытие и клавиши своего поля.
 */
export function createListBoxOwner<T>(options: ListBoxOwnerOptions<T>): ListBoxOwner<T> {
	const listId = `${createUniqueId()}-list`;
	const [scroller, setScroller] = createSignal<HTMLElement>();
	const [openSource, setOpenSource] = createSignal<ActiveSource>('keyboard');

	const rows = createMemo(() => flattenRows(options.items, {
		getKey: options.getKey,
		getLabel: options.getLabel,
		groupBy: options.groupBy,
		isItemDisabled: options.isItemDisabled,
		allKey: options.allKey
	}));
	const hasGroups = createMemo(() => rows().some((row) => row.kind === 'group'));

	// оценка высоты строки, предельная высота и padding списка читаются с якоря один раз за открытие
	const estimate = createMemo(() => {
		const anchor = options.anchor();
		return options.open() && anchor ? readControlHeight(anchor) : FALLBACK_ESTIMATE;
	});
	const maxHeight = createMemo(() => {
		const anchor = options.anchor();
		return options.open() && anchor ? readTokenPx(anchor, ['--s-kit-listbox-max-height'], FALLBACK_MAX_HEIGHT) : FALLBACK_MAX_HEIGHT;
	});
	const listPadding = createMemo(() => {
		const anchor = options.anchor();
		return options.open() && anchor ? readTokenPx(anchor, ['--s-kit-listbox-padding'], FALLBACK_PADDING) : FALLBACK_PADDING;
	});

	const windowOptions: RenderWindowOptions = {
		// закрытый список не держит измерений: оценка читается при открытии, до них
		count: () => (options.open() ? rows().length : 0),
		scroller,
		estimateSize: () => estimate(),
		overscan: untrack(() => options.overscan) ?? 6,
		scrollPaddingStart: () => (hasGroups() ? estimate() : 0),
		scrollPaddingEnd: () => listPadding(),
		initialHeight: () => Math.min(maxHeight(), rows().length * estimate())
	};
	const window = untrack(() => options.virtualized) === false ? createFullWindow(windowOptions) : createVirtualWindow(windowOptions);

	const controller = createListBoxController<T>({
		listId,
		rows,
		selectedKeys: options.selectedKeys,
		onActivate: options.onActivate,
		onActivateAll: options.onActivateAll,
		window,
		keys: options.keys,
		pageSize: () => {
			const element = scroller();
			return element ? Math.max(Math.floor(element.clientHeight / estimate()), 1) : 10;
		}
	});

	// подсветка и прокрутка к выбранному: скроллер появляется вместе с открытым списком
	createEffect(on(scroller, (element) => {
		if (element) {
			controller.resetActive(untrack(openSource), { ignoreSelected: options.ignoreSelectedOnReset?.() === true });
		}
	}));
	createComputed(on(options.open, (isOpen) => {
		if (!isOpen) {
			controller.clearActive();
		}
	}, { defer: true }));

	return {
		listId,
		rows,
		controller,
		window,
		setScroller: (element) => {
			setScroller(element);
		},
		setOpenSource: (source) => {
			setOpenSource(source);
		}
	};
}
