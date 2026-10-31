import { clampColumnWidth } from './clamp-column-width';

export interface ColumnResizeParams {
	/** Элемент ручки: на нём захват указателя и слушатели. */
	handle: HTMLElement;
	pointerId: number;
	/** `clientX` при `pointerdown`. */
	startX: number;
	/** Ширина колонки в начале перетаскивания, px. */
	startWidth: number;
	minWidth: number;
	/** Во время перетаскивания; ширина уже зажата. */
	onMove: (width: number) => void;
	/** Один раз на `pointerup`. */
	onCommit: (width: number) => void;
	/** Esc или `pointercancel`. */
	onCancel: () => void;
}

/**
 * Перетаскивание края колонки. Само ничего не знает о раскладке: считает ширину и сообщает её наружу.
 * Возвращает функцию принудительной отмены (размонтирование во время перетаскивания).
 */
export function startColumnResize(params: ColumnResizeParams): () => void {
	const { handle, pointerId, startX, startWidth, minWidth } = params;
	let lastWidth = startWidth;
	let finished = false;

	if ('setPointerCapture' in handle) {
		handle.setPointerCapture(pointerId);
	}

	function finish(): boolean {
		if (finished) {
			return false;
		}
		finished = true;
		handle.removeEventListener('pointermove', handleMove);
		handle.removeEventListener('pointerup', handleUp);
		handle.removeEventListener('pointercancel', cancel);
		document.removeEventListener('keydown', handleKeyDown, true);
		if ('hasPointerCapture' in handle && handle.hasPointerCapture(pointerId)) {
			handle.releasePointerCapture(pointerId);
		}
		return true;
	}

	function handleMove(event: PointerEvent | MouseEvent): void {
		const width = clampColumnWidth(startWidth + (event.clientX - startX), minWidth);
		if (width === lastWidth) {
			return;
		}
		lastWidth = width;
		params.onMove(width);
	}

	function handleUp(): void {
		if (finish()) {
			params.onCommit(lastWidth);
		}
	}

	function cancel(): void {
		if (finish()) {
			params.onCancel();
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === 'Escape') {
			event.stopPropagation();
			cancel();
		}
	}

	handle.addEventListener('pointermove', handleMove);
	handle.addEventListener('pointerup', handleUp);
	handle.addEventListener('pointercancel', cancel);
	document.addEventListener('keydown', handleKeyDown, true);

	return cancel;
}
