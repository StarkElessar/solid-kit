import { type Accessor, createEffect, createMemo, createSignal, on, onCleanup, untrack } from 'solid-js';

import type { RenderWindow, ScrollAlign } from '../../utils/render-window';

import { createTypeaheadBuffer } from './create-typeahead-buffer';
import { initialActiveIndex } from './initial-active-index';
import type { ListKey, ListRow } from './list-row';
import { matchTypeahead } from './match-typeahead';
import { type ActiveCommand, nextActiveIndex } from './next-active-index';
import { optionId } from './option-id';
import { resolveActiveKey } from './resolve-active-key';

export type ActiveSource = 'keyboard' | 'pointer';

export interface ListBoxControllerOptions<T> {
	/** Основа `id` опций: владелец списка ссылается на них через `aria-activedescendant`. */
	listId: string;
	rows: Accessor<readonly ListRow<T>[]>;
	selectedKeys: Accessor<ReadonlySet<ListKey>>;
	/** Клик или Enter/Space на активной опции (не для «Все» и не для отключённой). */
	onActivate: (item: T) => void;
	window: RenderWindow;
	/** Число полностью помещающихся строк окна: шаг PageUp/PageDown; по умолчанию 10. */
	pageSize?: Accessor<number> | undefined;
	keys?: { typeahead?: boolean | undefined; space?: boolean | undefined; homeEnd?: boolean | undefined } | undefined;
}

export interface ListBoxController {
	activeKey: Accessor<ListKey | undefined>;
	activeSource: Accessor<ActiveSource>;
	/** `id` активной опции для `aria-activedescendant` владельца. */
	activeId: Accessor<string | undefined>;
	setActiveKey: (key: ListKey | undefined, source: ActiveSource) => void;
	/** Активирует опцию по ключу (клик): отключённые и «Все» игнорируются. */
	activate: (key: ListKey) => void;
	/** При открытии: подсветка на выбранной (иначе первой доступной) и прокрутка к ней, сразу и в следующем кадре. */
	resetActive: (source?: ActiveSource) => void;
	/** При закрытии. */
	clearActive: () => void;
	isSelected: (key: ListKey) => boolean;
	/** `true`, если клавиша обработана: владелец вызывает `preventDefault()`. */
	handleKeyDown: (event: KeyboardEvent) => boolean;
}

const DEFAULT_PAGE_SIZE = 10;

const NAVIGATION: Readonly<Record<string, ActiveCommand>> = {
	ArrowDown: 'next',
	ArrowUp: 'previous',
	PageDown: 'next-page',
	PageUp: 'previous-page',
	Home: 'first',
	End: 'last'
};

/**
 * Состояние и клавиши списка без разметки (спек этапа 3, раздел 5.2). Фокус остаётся у владельца списка; контроллер хранит
 * ключ активной опции и прокручивает окно рендера. Подсветка хранится по ключу, а не по индексу или элементу DOM.
 */
export function createListBoxController<T>(options: ListBoxControllerOptions<T>): ListBoxController {
	const [activeKey, setActiveKeyRaw] = createSignal<ListKey | undefined>();
	const [activeSource, setActiveSource] = createSignal<ActiveSource>('keyboard');
	const typeahead = createTypeaheadBuffer();

	// индекс по ключу: только опции и «Все», заголовок с таким же ключом не должен перехватить подсветку
	const indexByKey = createMemo(() => {
		const map = new Map<ListKey, number>();
		options.rows().forEach((row, index) => {
			if (row.kind !== 'group') {
				map.set(row.key, index);
			}
		});
		return map;
	});
	const activeIndex = (): number => {
		const key = activeKey();
		return key === undefined ? -1 : (indexByKey().get(key) ?? -1);
	};

	let frame: number | undefined;
	onCleanup(() => {
		if (frame !== undefined) {
			cancelAnimationFrame(frame);
		}
	});

	const scrollWindow = (index: number, align: ScrollAlign | undefined): void => {
		options.window.scrollToIndex(index, align === undefined ? undefined : { align });
	};

	// строка могла быть ещё не измерена или панель скрыта до показа: прокрутка повторяется в следующем кадре
	const scrollToActive = (index: number, align: ScrollAlign | undefined, retry: 'always' | 'unmounted'): void => {
		scrollWindow(index, align);
		if (frame !== undefined) {
			cancelAnimationFrame(frame);
		}
		frame = requestAnimationFrame(() => {
			frame = undefined;
			if (activeIndex() !== index) {
				return;
			}
			if (retry === 'always' || !options.window.items().some((item) => item.index === index)) {
				scrollWindow(index, align);
			}
		});
	};

	const moveTo = (index: number): void => {
		const row = options.rows()[index];
		if (row === undefined || row.kind === 'group') {
			return;
		}
		setActiveKeyRaw(row.key);
		setActiveSource('keyboard');
		scrollToActive(index, undefined, 'unmounted');
	};

	const activateIndex = (index: number): void => {
		const row = options.rows()[index];
		if (row?.kind === 'option' && !row.disabled) {
			options.onActivate(row.item);
		}
	};

	createEffect(on(options.rows, (rows) => {
		const key = untrack(activeKey);
		if (key === undefined) {
			return;
		}
		const next = resolveActiveKey(rows, key);
		if (next !== key) {
			setActiveKeyRaw(next);
			const index = next === undefined ? -1 : (indexByKey().get(next) ?? -1);
			if (index !== -1) {
				scrollToActive(index, undefined, 'unmounted');
			}
		}
	}, { defer: true }));

	const handleKeyDown = (event: KeyboardEvent): boolean => {
		if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) {
			return false;
		}
		const key = event.key;
		const keys = options.keys;
		const command = NAVIGATION[key];

		if (command !== undefined) {
			if ((command === 'first' || command === 'last') && keys?.homeEnd === false) {
				return false;
			}
			const next = nextActiveIndex(options.rows(), activeIndex(), command, options.pageSize?.() ?? DEFAULT_PAGE_SIZE);
			if (next !== -1) {
				moveTo(next);
			}
			return true;
		}
		if (key === 'Enter') {
			const index = activeIndex();
			activateIndex(index);
			return index !== -1;
		}
		const typeaheadEnabled = keys?.typeahead !== false;
		const isSpace = key === ' ';
		if (isSpace && !(typeaheadEnabled && typeahead.value() !== '')) {
			if (keys?.space === false) {
				return false;
			}
			activateIndex(activeIndex());
			return true;
		}
		if (typeaheadEnabled && key.length === 1) {
			const index = matchTypeahead(options.rows(), activeIndex(), typeahead.push(key));
			if (index !== -1) {
				moveTo(index);
			}
			return true;
		}
		return false;
	};

	return {
		activeKey,
		activeSource,
		activeId: () => {
			const key = activeKey();
			return key === undefined ? undefined : optionId(options.listId, key);
		},
		setActiveKey: (key, source) => {
			setActiveKeyRaw(key);
			setActiveSource(source);
		},
		activate: (key) => {
			const index = indexByKey().get(key);
			if (index !== undefined) {
				activateIndex(index);
			}
		},
		resetActive: (source = 'keyboard') => {
			const rows = options.rows();
			const index = initialActiveIndex(rows, [...options.selectedKeys()]);
			const row = rows[index];
			typeahead.clear();
			setActiveSource(source);
			if (row === undefined || row.kind === 'group') {
				setActiveKeyRaw(undefined);
				return;
			}
			setActiveKeyRaw(row.key);
			scrollToActive(index, 'center', 'always');
		},
		clearActive: () => {
			typeahead.clear();
			setActiveKeyRaw(undefined);
		},
		isSelected: (key) => options.selectedKeys().has(key),
		handleKeyDown
	};
}
