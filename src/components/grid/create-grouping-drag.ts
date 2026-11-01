import { type Accessor, createSignal, onCleanup } from 'solid-js';

import type { GroupingDragState } from './grouping-drag-state';
import { insertionSlot } from './insertion-slot';
import { placeGrouping } from './place-grouping';

/** Смещение указателя, с которого нажатие становится перетаскиванием: меньшее остаётся кликом (сортировка, фокус). */
const DRAG_THRESHOLD = 4;

export interface GroupingDragOptions {
	/** Корень грида: в нём ищутся панель и чипы. */
	root: Accessor<HTMLElement | undefined>;
	/** Жест разрешён для колонки (`groupable` грида и колонки). */
	canStart: (columnId: string) => boolean;
	title: (columnId: string) => string;
	grouping: Accessor<readonly string[]>;
	setGrouping: (next: readonly string[]) => void;
}

export interface GroupingDrag {
	state: Accessor<GroupingDragState | undefined>;
	/** `pointerdown` на заголовке колонки или чипе. */
	begin: (columnId: string, event: PointerEvent) => void;
}

function measure(root: HTMLElement | undefined, x: number, y: number): { overPanel: boolean; slot: number } {
	const panel = root?.querySelector<HTMLElement>('[data-grouping-panel]');
	if (panel === null || panel === undefined) {
		return { overPanel: false, slot: 0 };
	}
	const rect = panel.getBoundingClientRect();
	const centers = [...panel.querySelectorAll<HTMLElement>('[data-chip]')].map((chip) => {
		const box = chip.getBoundingClientRect();
		return box.left + box.width / 2;
	});
	return {
		overPanel: x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom,
		slot: insertionSlot(centers, x)
	};
}

/** Клик, которым браузер завершает перетаскивание (отпускание над той же кнопкой), гасится один раз: сортировка не срабатывает. */
function swallowNextClick(): void {
	const block = (event: Event): void => {
		event.stopPropagation();
		event.preventDefault();
	};
	document.addEventListener('click', block, true);
	window.setTimeout(() => {
		document.removeEventListener('click', block, true);
	}, 0);
}

/**
 * Перетаскивание заголовка колонки или чипа в панель группировки на Pointer Events (спек группировки, раздел 8). Слушатели живут на
 * `document` только во время жеста. Касание жест не начинает: прокрутка не должна с ним сталкиваться, для тач-экрана есть меню колонки.
 */
export function createGroupingDrag(options: GroupingDragOptions): GroupingDrag {
	const [state, setState] = createSignal<GroupingDragState>();
	let cancelActive: (() => void) | undefined;

	function begin(columnId: string, event: PointerEvent): void {
		if (event.button !== 0 || event.pointerType === 'touch' || !options.canStart(columnId)) {
			return;
		}
		cancelActive?.();
		const startX = event.clientX;
		const startY = event.clientY;
		let started = false;
		let last: GroupingDragState | undefined;

		const onMove = (move: PointerEvent): void => {
			if (!started) {
				if (Math.hypot(move.clientX - startX, move.clientY - startY) < DRAG_THRESHOLD) {
					return;
				}
				started = true;
				window.getSelection()?.removeAllRanges();
			}
			last = {
				columnId,
				title: options.title(columnId),
				x: move.clientX,
				y: move.clientY,
				...measure(options.root(), move.clientX, move.clientY)
			};
			setState(last);
		};
		const finish = (apply: boolean): void => {
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
			document.removeEventListener('pointercancel', onCancel);
			document.removeEventListener('keydown', onKey, true);
			setState(undefined);
			cancelActive = undefined;
			if (!started) {
				return;
			}
			swallowNextClick();
			if (apply && last?.overPanel === true) {
				options.setGrouping(placeGrouping(options.grouping(), columnId, last.slot));
			}
		};
		const onUp = (): void => {
			finish(true);
		};
		const onCancel = (): void => {
			finish(false);
		};
		// Esc отменяет жест и не доходит до остальных слоёв (меню, панели)
		const onKey = (key: KeyboardEvent): void => {
			if (key.key === 'Escape') {
				key.preventDefault();
				key.stopPropagation();
				finish(false);
			}
		};

		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', onUp);
		document.addEventListener('pointercancel', onCancel);
		document.addEventListener('keydown', onKey, true);
		cancelActive = () => {
			started = false;
			finish(false);
		};
	}

	onCleanup(() => {
		cancelActive?.();
	});

	return { state, begin };
}
