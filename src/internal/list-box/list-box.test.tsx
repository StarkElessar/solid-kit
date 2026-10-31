import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { createMemo, createSignal, type JSX, untrack } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFullWindow } from '../../utils/create-full-window';
import { createVirtualWindow } from '../../utils/create-virtual-window';
import { installListGeometry } from '../testing/list-geometry';

import { createListBoxController, type ListBoxController } from './create-list-box-controller';
import { flattenRows } from './flatten-rows';
import { ListBox, type ListBoxProps } from './list-box';

interface Handle {
	controller: ListBoxController;
	scroller: () => HTMLElement | undefined;
	activated: string[];
}

type PassedProps = 'multiple' | 'loading' | 'emptyText' | 'loadingText' | 'renderOption' | 'renderGroupHeader';

interface HarnessProps extends Partial<Pick<ListBoxProps<string>, PassedProps>> {
	items: readonly string[];
	groupBy?: (item: string) => string;
	disabled?: readonly string[];
	selected?: readonly string[];
	virtualized?: boolean;
	onReady?: (handle: Handle) => void;
}

function Harness(props: HarnessProps): JSX.Element {
	const rows = createMemo(() => flattenRows(props.items, {
		getKey: (item) => item,
		getLabel: (item) => item,
		groupBy: props.groupBy,
		isItemDisabled: (item) => props.disabled?.includes(item) ?? false
	}));
	const [scroller, setScroller] = createSignal<HTMLElement>();
	const windowOptions = { count: () => rows().length, scroller, estimateSize: () => 20, overscan: 2, initialHeight: () => 100 };
	// режим окна выбирается один раз при создании
	const window = untrack(() => props.virtualized) === false ? createFullWindow(windowOptions) : createVirtualWindow(windowOptions);
	const activated: string[] = [];
	const controller = createListBoxController<string>({
		listId: 'lb',
		rows,
		selectedKeys: () => new Set(props.selected ?? []),
		onActivate: (item) => activated.push(item),
		window
	});
	untrack(() => props.onReady)?.({ controller, scroller, activated });
	return (
		<ListBox
			listId='lb'
			controller={controller}
			rows={rows}
			window={window}
			scrollerRef={setScroller}
			multiple={props.multiple}
			loading={props.loading}
			emptyText={props.emptyText}
			loadingText={props.loadingText}
			renderOption={props.renderOption}
			renderGroupHeader={props.renderGroupHeader}
		/>
	);
}

function numbered(count: number): string[] {
	return Array.from({ length: count }, (_, index) => `item-${index}`);
}

beforeEach(() => {
	installListGeometry({ rowHeight: 20, viewportHeight: 100 });
});

afterEach(cleanup);

describe('ListBox: разметка и ARIA', () => {
	it('скроллер role=listbox с id, без tabindex; aria-multiselectable только при multiple', () => {
		const { unmount } = render(() => <Harness items={numbered(3)}/>);
		const listbox = screen.getByRole('listbox');
		expect(listbox.id).toBe('lb');
		expect(listbox.hasAttribute('tabindex')).toBe(false);
		expect(listbox.hasAttribute('aria-multiselectable')).toBe(false);
		expect(listbox.hasAttribute('data-s-kit-focus-inset')).toBe(true);
		unmount();
		render(() => <Harness items={numbered(3)} multiple/>);
		expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true');
	});

	it('опция: id, aria-selected, aria-setsize, aria-posinset, data-index, title', () => {
		render(() => <Harness items={['Анна', 'Борис']} selected={['Борис']}/>);
		const [first, second] = screen.getAllByRole('option');
		expect(first?.id).toBe('lb-opt-s%D0%90%D0%BD%D0%BD%D0%B0');
		expect(first?.getAttribute('aria-selected')).toBe('false');
		expect(second?.getAttribute('aria-selected')).toBe('true');
		expect(first?.getAttribute('aria-setsize')).toBe('2');
		expect(first?.getAttribute('aria-posinset')).toBe('1');
		expect(second?.getAttribute('aria-posinset')).toBe('2');
		expect(first?.getAttribute('data-index')).toBe('0');
		expect(first?.getAttribute('title')).toBe('Анна');
		expect(second?.hasAttribute('data-selected')).toBe(true);
	});

	it('отключённая опция получает aria-disabled', () => {
		render(() => <Harness items={['a', 'b']} disabled={['b']}/>);
		const [first, second] = screen.getAllByRole('option');
		expect(first?.hasAttribute('aria-disabled')).toBe(false);
		expect(second?.getAttribute('aria-disabled')).toBe('true');
	});

	it('группы: заголовок role=presentation, нумерация опций сквозная, заголовки не считаются', () => {
		const items = ['a1', 'b1', 'a2', 'b2'];
		render(() => <Harness items={items} groupBy={(item) => item.slice(0, 1)} virtualized={false}/>);
		const options = screen.getAllByRole('option');
		expect(options.map((option) => option.getAttribute('aria-posinset'))).toEqual(['1', '2', '3', '4']);
		expect(options.every((option) => option.getAttribute('aria-setsize') === '4')).toBe(true);
		const headers = screen.getAllByRole('presentation').filter((element) => element.hasAttribute('data-index'));
		expect(headers.map((header) => header.textContent)).toEqual(['a', 'b']);
		expect(headers.map((header) => header.getAttribute('data-index'))).toEqual(['0', '3']);
	});
});

describe('ListBox: окно рендера', () => {
	it('в DOM только окно плюс overscan, spacer даёт полную высоту', () => {
		const { container } = render(() => <Harness items={numbered(1000)}/>);
		expect(screen.getAllByRole('option')).toHaveLength(7);
		const spacers = container.querySelectorAll<HTMLElement>('[role="listbox"] > [aria-hidden="true"]');
		expect(spacers).toHaveLength(2);
		expect(spacers[0]?.style.blockSize).toBe('0px');
		expect(spacers[1]?.style.blockSize).toBe(`${(1000 - 7) * 20}px`);
	});

	it('при прокрутке окно сдвигается, верхний spacer растёт', () => {
		let handle: Handle | undefined;
		const { container } = render(() => (
			<Harness
				items={numbered(1000)}
				onReady={(ready) => {
					handle = ready;
				}}
			/>
		));
		const scroller = handle?.scroller();
		expect(scroller).toBeDefined();
		if (scroller) {
			scroller.scrollTop = 2000;
			fireEvent.scroll(scroller);
		}
		const indexes = screen.getAllByRole('option').map((option) => Number(option.getAttribute('data-index')));
		expect(indexes[0]).toBe(98);
		expect(indexes).toContain(104);
		const top = container.querySelector<HTMLElement>('[role="listbox"] > [aria-hidden="true"]');
		expect(top?.style.blockSize).toBe('1960px');
	});

	it('virtualized=false рендерит все строки', () => {
		render(() => <Harness items={numbered(300)} virtualized={false}/>);
		expect(screen.getAllByRole('option')).toHaveLength(300);
	});
});

describe('ListBox: подсветка и указатель', () => {
	it('data-active следует за controller.activeKey, источник на скроллере', () => {
		let handle: Handle | undefined;
		render(() => (
			<Harness
				items={['a', 'b']}
				onReady={(ready) => {
					handle = ready;
				}}
			/>
		));
		const [first, second] = screen.getAllByRole('option');
		expect(first?.hasAttribute('data-active')).toBe(false);
		handle?.controller.setActiveKey('b', 'keyboard');
		expect(first?.hasAttribute('data-active')).toBe(false);
		expect(second?.hasAttribute('data-active')).toBe(true);
		expect(screen.getByRole('listbox').getAttribute('data-active-source')).toBe('keyboard');
		handle?.controller.setActiveKey('a', 'pointer');
		expect(screen.getByRole('listbox').getAttribute('data-active-source')).toBe('pointer');
	});

	it('mousemove ставит опцию активной с источником pointer; на отключённой не ставит', () => {
		let handle: Handle | undefined;
		render(() => (
			<Harness
				items={['a', 'b']}
				disabled={['b']}
				onReady={(ready) => {
					handle = ready;
				}}
			/>
		));
		const [first, second] = screen.getAllByRole('option');
		if (second) {
			fireEvent.mouseMove(second);
		}
		expect(handle?.controller.activeKey()).toBeUndefined();
		if (first) {
			fireEvent.mouseMove(first);
		}
		expect(handle?.controller.activeKey()).toBe('a');
		expect(handle?.controller.activeSource()).toBe('pointer');
	});

	it('click активирует опцию, на отключённой не активирует', () => {
		let handle: Handle | undefined;
		render(() => (
			<Harness
				items={['a', 'b']}
				disabled={['b']}
				onReady={(ready) => {
					handle = ready;
				}}
			/>
		));
		const [first, second] = screen.getAllByRole('option');
		if (second) {
			fireEvent.click(second);
		}
		if (first) {
			fireEvent.click(first);
		}
		expect(handle?.activated).toEqual(['a']);
	});

	it('mousedown на списке отменяется: фокус не уходит с владельца', () => {
		render(() => <Harness items={['a']}/>);
		expect(fireEvent.mouseDown(screen.getByRole('option'))).toBe(false);
	});
});

describe('ListBox: содержимое', () => {
	it('renderOption и renderGroupHeader заменяют содержимое, состояние приходит аксессорами', () => {
		let handle: Handle | undefined;
		render(() => (
			<Harness
				items={['a1', 'b1']}
				groupBy={(item) => item.slice(0, 1)}
				virtualized={false}
				selected={['b1']}
				renderOption={(item, state) => <i data-custom={item} data-selected-state={String(state.selected())}>{item}!</i>}
				renderGroupHeader={(label) => <b>группа {label}</b>}
				onReady={(ready) => {
					handle = ready;
				}}
			/>
		));
		expect(screen.getByText('a1!').getAttribute('data-selected-state')).toBe('false');
		expect(screen.getByText('b1!').getAttribute('data-selected-state')).toBe('true');
		expect(screen.getByText('группа a')).toBeDefined();
		expect(handle).toBeDefined();
	});

	it('loading показывает текст загрузки вместо строк, пустой список показывает emptyText', () => {
		const { unmount } = render(() => <Harness items={['a']} loading/>);
		expect(screen.getByRole('status').textContent).toBe('Загрузка…');
		expect(screen.queryAllByRole('option')).toHaveLength(0);
		unmount();
		render(() => <Harness items={[]} emptyText='Пусто'/>);
		expect(screen.getByText('Пусто')).toBeDefined();
		cleanup();
		render(() => <Harness items={[]}/>);
		expect(screen.getByText('Нет элементов для отображения')).toBeDefined();
	});

	it('липкий заголовок: появляется, когда строка заголовка группы ушла вверх, и показывает её подпись', () => {
		let handle: Handle | undefined;
		const items = [...Array.from({ length: 50 }, (_, index) => `a${index}`), ...Array.from({ length: 50 }, (_, index) => `b${index}`)];
		const { container } = render(() => (
			<Harness
				items={items}
				groupBy={(item) => item.slice(0, 1)}
				onReady={(ready) => {
					handle = ready;
				}}
			/>
		));
		expect(container.querySelector('[data-list-box-sticky]')).toBeNull();
		const scroller = handle?.scroller();
		if (scroller) {
			scroller.scrollTop = 400;
			fireEvent.scroll(scroller);
		}
		expect(container.querySelector('[data-list-box-sticky]')?.textContent).toBe('a');
		if (scroller) {
			scroller.scrollTop = 1200;
			fireEvent.scroll(scroller);
		}
		expect(container.querySelector('[data-list-box-sticky]')?.textContent).toBe('b');
	});

	it('scrollerRef получает undefined при удалении списка', () => {
		const ref = vi.fn();
		function Wrapper(): JSX.Element {
			const rows = (): never[] => [];
			const window = createFullWindow({ count: () => 0, scroller: () => undefined, estimateSize: () => 20, overscan: 2 });
			const controller = createListBoxController<string>({
				listId: 'x',
				rows,
				selectedKeys: () => new Set(),
				onActivate: () => undefined,
				window
			});
			return <ListBox listId='x' controller={controller} rows={rows} window={window} scrollerRef={ref}/>;
		}
		const { unmount } = render(() => <Wrapper/>);
		expect(ref).toHaveBeenLastCalledWith(expect.any(HTMLElement));
		unmount();
		expect(ref).toHaveBeenLastCalledWith(undefined);
	});
});
