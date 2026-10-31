import { createRoot, createSignal } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestWindow } from '../../utils/render-window.test-helper';

import { createListBoxController, type ListBoxControllerOptions } from './create-list-box-controller';
import { flattenRows } from './flatten-rows';
import type { ListRow } from './list-row';
import { buildRows } from './rows.test-helper';

let frames: FrameRequestCallback[] = [];

function flushFrames(): void {
	const pending = frames;
	frames = [];
	for (const callback of pending) {
		callback(0);
	}
}

function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
	return new KeyboardEvent('keydown', { key, cancelable: true, ...init });
}

function numberedRows(count: number): readonly ListRow<string>[] {
	return flattenRows(Array.from({ length: count }, (_, index) => `item-${index}`), { getKey: (item) => item, getLabel: (item) => item });
}

interface Setup {
	controller: ReturnType<typeof createListBoxController<string>>;
	window: ReturnType<typeof createTestWindow>;
	activated: string[];
	setRows: (rows: readonly ListRow<string>[]) => void;
	setSelected: (keys: string[]) => void;
	dispose: () => void;
}

function setup(
	rows: readonly ListRow<string>[],
	extra: Partial<Pick<ListBoxControllerOptions<string>, 'keys' | 'pageSize'>> = {}
): Setup {
	return createRoot((dispose) => {
		const [rowsSignal, setRows] = createSignal(rows);
		const [selected, setSelected] = createSignal<ReadonlySet<string>>(new Set());
		const window = createTestWindow({ count: () => rowsSignal().length, size: 20, windowHeight: 100 });
		const activated: string[] = [];
		const controller = createListBoxController<string>({
			listId: 'list',
			rows: rowsSignal,
			selectedKeys: selected,
			onActivate: (item) => activated.push(item),
			window,
			...extra
		});
		return { controller, window, activated, setRows, setSelected: (keys) => setSelected(new Set(keys)), dispose };
	});
}

beforeEach(() => {
	frames = [];
	vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
	vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
});

// индексы: 0 #G1, 1 A, 2 !B, 3 C, 4 #G2, 5 D, 6 E
const small = buildRows(['#G1', 'A', '!B', 'C', '#G2', 'D', 'E']);

describe('createListBoxController: стрелки', () => {
	it('ArrowDown и ArrowUp идут по доступным строкам, пропуская заголовки и отключённые', () => {
		const { controller, dispose } = setup(small);
		expect(controller.handleKeyDown(press('ArrowDown'))).toBe(true);
		expect(controller.activeKey()).toBe('A');
		controller.handleKeyDown(press('ArrowDown'));
		expect(controller.activeKey()).toBe('C');
		controller.handleKeyDown(press('ArrowDown'));
		expect(controller.activeKey()).toBe('D');
		controller.handleKeyDown(press('ArrowUp'));
		expect(controller.activeKey()).toBe('C');
		dispose();
	});

	it('на краях подсветка остаётся на месте', () => {
		const { controller, dispose } = setup(small);
		controller.handleKeyDown(press('End'));
		expect(controller.activeKey()).toBe('E');
		controller.handleKeyDown(press('ArrowDown'));
		expect(controller.activeKey()).toBe('E');
		controller.handleKeyDown(press('Home'));
		controller.handleKeyDown(press('ArrowUp'));
		expect(controller.activeKey()).toBe('A');
		dispose();
	});

	it('Home и End; keys.homeEnd === false их не обрабатывает', () => {
		const { controller, dispose } = setup(small);
		expect(controller.handleKeyDown(press('End'))).toBe(true);
		expect(controller.activeKey()).toBe('E');
		dispose();
		const off = setup(small, { keys: { homeEnd: false } });
		expect(off.controller.handleKeyDown(press('End'))).toBe(false);
		expect(off.controller.activeKey()).toBeUndefined();
		off.dispose();
	});

	it('PageDown и PageUp шагают на pageSize', () => {
		const rows = numberedRows(50);
		const { controller, dispose } = setup(rows, { pageSize: () => 5 });
		controller.handleKeyDown(press('ArrowDown'));
		controller.handleKeyDown(press('PageDown'));
		expect(controller.activeKey()).toBe('item-5');
		controller.handleKeyDown(press('PageUp'));
		expect(controller.activeKey()).toBe('item-0');
		dispose();
	});

	it('модификаторы и IME не обрабатываются', () => {
		const { controller, dispose } = setup(small);
		expect(controller.handleKeyDown(press('ArrowDown', { ctrlKey: true }))).toBe(false);
		expect(controller.handleKeyDown(press('ArrowDown', { isComposing: true }))).toBe(false);
		expect(controller.activeKey()).toBeUndefined();
		dispose();
	});

	it('нет доступных строк: клавиша обработана, подсветки нет', () => {
		const { controller, dispose } = setup(buildRows(['#G', '!A']));
		expect(controller.handleKeyDown(press('ArrowDown'))).toBe(true);
		expect(controller.activeKey()).toBeUndefined();
		dispose();
	});
});

describe('createListBoxController: активация', () => {
	it('Enter и Space активируют активную опцию', () => {
		const { controller, activated, dispose } = setup(small);
		controller.handleKeyDown(press('ArrowDown'));
		expect(controller.handleKeyDown(press('Enter'))).toBe(true);
		expect(controller.handleKeyDown(press(' '))).toBe(true);
		expect(activated).toEqual(['A', 'A']);
		dispose();
	});

	it('Enter без активной опции не обрабатывается; keys.space === false оставляет пробел', () => {
		const { controller, dispose } = setup(small, { keys: { space: false } });
		expect(controller.handleKeyDown(press('Enter'))).toBe(false);
		controller.handleKeyDown(press('ArrowDown'));
		expect(controller.handleKeyDown(press(' '))).toBe(false);
		dispose();
	});

	it('activate по ключу: отключённая опция, заголовок и «Все» игнорируются', () => {
		const rows = buildRows(['#G', '!B', 'C', '=Все']);
		const { controller, activated, dispose } = setup(rows);
		controller.activate('B');
		controller.activate('G');
		controller.activate('Все');
		controller.activate('нет');
		controller.activate('C');
		expect(activated).toEqual(['C']);
		dispose();
	});
});

describe('createListBoxController: typeahead', () => {
	const fruits = buildRows(['Абрикос', 'Апельсин', 'Банан', 'Ананас']);

	it('буква переводит подсветку на опцию с этой буквы', () => {
		const { controller, dispose } = setup(fruits);
		expect(controller.handleKeyDown(press('б'))).toBe(true);
		expect(controller.activeKey()).toBe('Банан');
		dispose();
	});

	it('две буквы подряд уточняют поиск, повтор буквы идёт к следующей опции', () => {
		const { controller, dispose } = setup(fruits);
		controller.handleKeyDown(press('а'));
		expect(controller.activeKey()).toBe('Абрикос');
		controller.handleKeyDown(press('а'));
		expect(controller.activeKey()).toBe('Апельсин');
		dispose();
	});

	it('пробел внутри набора идёт в буфер, а не активирует', () => {
		const rows = buildRows(['Иван Петров', 'Иван Сидоров', 'Иван Иванов']);
		const { controller, activated, dispose } = setup(rows);
		for (const char of 'иван') {
			controller.handleKeyDown(press(char));
		}
		controller.handleKeyDown(press(' '));
		expect(activated).toEqual([]);
		controller.handleKeyDown(press('с'));
		expect(controller.activeKey()).toBe('Иван Сидоров');
		dispose();
	});

	it('keys.typeahead === false не обрабатывает буквы', () => {
		const { controller, dispose } = setup(fruits, { keys: { typeahead: false } });
		expect(controller.handleKeyDown(press('б'))).toBe(false);
		expect(controller.activeKey()).toBeUndefined();
		dispose();
	});

	it('нет совпадения: символ потреблён, подсветка не меняется', () => {
		const { controller, dispose } = setup(fruits);
		controller.handleKeyDown(press('б'));
		expect(controller.handleKeyDown(press('я'))).toBe(true);
		expect(controller.activeKey()).toBe('Банан');
		dispose();
	});
});

describe('createListBoxController: прокрутка', () => {
	const big = numberedRows(1000);

	it('стрелка у края окна просит scrollToIndex', () => {
		const { controller, window, dispose } = setup(big);
		controller.setActiveKey('item-4', 'keyboard');
		controller.handleKeyDown(press('ArrowDown'));
		expect(window.calls.at(-1)).toEqual({ index: 5, align: undefined });
		expect(window.offset()).toBe(20);
		dispose();
	});

	it('повтор прокрутки в кадре, если строки нет среди смонтированных', () => {
		const { controller, window, dispose } = setup(big);
		const scroll = vi.spyOn(window, 'scrollToIndex');
		vi.spyOn(window, 'items').mockReturnValue([]);
		controller.handleKeyDown(press('ArrowDown'));
		expect(scroll).toHaveBeenCalledTimes(1);
		flushFrames();
		expect(scroll).toHaveBeenCalledTimes(2);
		dispose();
	});

	it('повтора нет, если строка уже смонтирована', () => {
		const { controller, window, dispose } = setup(big);
		const scroll = vi.spyOn(window, 'scrollToIndex');
		controller.handleKeyDown(press('ArrowDown'));
		flushFrames();
		expect(scroll).toHaveBeenCalledTimes(1);
		dispose();
	});
});

describe('createListBoxController: resetActive, clearActive, данные', () => {
	const big = numberedRows(1000);

	it('выбранная опция вне окна: подсветка и прокрутка к центру дважды (сразу и в кадре)', () => {
		const { controller, window, setSelected, dispose } = setup(big);
		setSelected(['item-500']);
		controller.resetActive();
		expect(controller.activeKey()).toBe('item-500');
		expect(window.calls).toEqual([{ index: 500, align: 'center' }]);
		flushFrames();
		expect(window.calls).toEqual([{ index: 500, align: 'center' }, { index: 500, align: 'center' }]);
		dispose();
	});

	it('без выбранного подсвечивается первая доступная, источник передаётся', () => {
		const { controller, dispose } = setup(small);
		controller.resetActive('pointer');
		expect(controller.activeKey()).toBe('A');
		expect(controller.activeSource()).toBe('pointer');
		dispose();
	});

	it('пустой список: подсветки нет', () => {
		const { controller, dispose } = setup(buildRows(['#G', '!A']));
		controller.resetActive();
		expect(controller.activeKey()).toBeUndefined();
		dispose();
	});

	it('activeId строится из id списка и ключа; clearActive сбрасывает', () => {
		const { controller, dispose } = setup(small);
		expect(controller.activeId()).toBeUndefined();
		controller.setActiveKey('C', 'pointer');
		expect(controller.activeId()).toBe('list-opt-sC');
		expect(controller.activeSource()).toBe('pointer');
		controller.clearActive();
		expect(controller.activeKey()).toBeUndefined();
		expect(controller.activeId()).toBeUndefined();
		dispose();
	});

	it('смена rows сохраняет подсветку, если ключ остался доступным', () => {
		const { controller, setRows, dispose } = setup(small);
		controller.setActiveKey('D', 'keyboard');
		setRows(buildRows(['C', 'D']));
		expect(controller.activeKey()).toBe('D');
		dispose();
	});

	it('смена rows переводит подсветку на первую доступную, если ключ пропал, и прокручивает к ней', () => {
		const { controller, window, setRows, dispose } = setup(small);
		controller.setActiveKey('D', 'keyboard');
		setRows(buildRows(['X', 'Y']));
		expect(controller.activeKey()).toBe('X');
		expect(window.calls.at(-1)).toEqual({ index: 0, align: undefined });
		dispose();
	});

	it('смена rows при закрытом списке (нет подсветки) её не создаёт', () => {
		const { controller, setRows, dispose } = setup(small);
		setRows(buildRows(['X', 'Y']));
		expect(controller.activeKey()).toBeUndefined();
		dispose();
	});

	it('isSelected читает выбранные ключи', () => {
		const { controller, setSelected, dispose } = setup(small);
		setSelected(['C']);
		expect(controller.isSelected('C')).toBe(true);
		expect(controller.isSelected('A')).toBe(false);
		dispose();
	});
});
