import { afterEach, describe, expect, it, vi } from 'vitest';

import { startColumnResize } from './start-column-resize';

function pointer(type: string, clientX: number): MouseEvent {
	return new MouseEvent(type, { clientX, bubbles: true });
}

function setup(overrides: { startWidth?: number; minWidth?: number } = {}) {
	const handle = document.createElement('span');
	document.body.append(handle);
	const onMove = vi.fn();
	const onCommit = vi.fn();
	const onCancel = vi.fn();
	const cancel = startColumnResize({
		handle,
		pointerId: 1,
		startX: 100,
		startWidth: overrides.startWidth ?? 200,
		minWidth: overrides.minWidth ?? 60,
		onMove,
		onCommit,
		onCancel
	});
	return { handle, onMove, onCommit, onCancel, cancel };
}

describe('startColumnResize', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	it('движение вправо и влево считает ширину от начала', () => {
		const { handle, onMove } = setup();
		handle.dispatchEvent(pointer('pointermove', 150));
		handle.dispatchEvent(pointer('pointermove', 70));
		expect(onMove.mock.calls).toEqual([[250], [170]]);
	});

	it('ширина зажимается по minWidth', () => {
		const { handle, onMove } = setup({ minWidth: 80 });
		handle.dispatchEvent(pointer('pointermove', -500));
		expect(onMove).toHaveBeenCalledExactlyOnceWith(80);
	});

	it('onMove не зовётся, если ширина не изменилась', () => {
		const { handle, onMove } = setup();
		handle.dispatchEvent(pointer('pointermove', 100));
		expect(onMove).not.toHaveBeenCalled();
		handle.dispatchEvent(pointer('pointermove', 130));
		handle.dispatchEvent(pointer('pointermove', 130));
		expect(onMove).toHaveBeenCalledTimes(1);
	});

	it('pointerup зовёт onCommit один раз с последней шириной', () => {
		const { handle, onCommit, onCancel } = setup();
		handle.dispatchEvent(pointer('pointermove', 140));
		handle.dispatchEvent(pointer('pointerup', 140));
		handle.dispatchEvent(pointer('pointerup', 300));
		expect(onCommit).toHaveBeenCalledExactlyOnceWith(240);
		expect(onCancel).not.toHaveBeenCalled();
	});

	it('pointerup без движения даёт onCommit(startWidth)', () => {
		const { handle, onCommit } = setup({ startWidth: 180 });
		handle.dispatchEvent(pointer('pointerup', 100));
		expect(onCommit).toHaveBeenCalledExactlyOnceWith(180);
	});

	it('Esc зовёт onCancel и не зовёт onCommit', () => {
		const { handle, onCommit, onCancel } = setup();
		handle.dispatchEvent(pointer('pointermove', 140));
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		handle.dispatchEvent(pointer('pointerup', 140));
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onCommit).not.toHaveBeenCalled();
	});

	it('другая клавиша перетаскивание не отменяет', () => {
		const { handle, onCancel, onCommit } = setup();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
		handle.dispatchEvent(pointer('pointerup', 100));
		expect(onCancel).not.toHaveBeenCalled();
		expect(onCommit).toHaveBeenCalledTimes(1);
	});

	it('pointercancel зовёт onCancel и не зовёт onCommit', () => {
		const { handle, onCommit, onCancel } = setup();
		handle.dispatchEvent(pointer('pointercancel', 100));
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onCommit).not.toHaveBeenCalled();
	});

	it('после завершения слушатели сняты', () => {
		const { handle, onMove, onCancel } = setup();
		handle.dispatchEvent(pointer('pointerup', 100));
		handle.dispatchEvent(pointer('pointermove', 300));
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(onMove).not.toHaveBeenCalled();
		expect(onCancel).not.toHaveBeenCalled();
	});

	it('функция отмены делает то же, что Esc, и безопасна при повторном вызове', () => {
		const { handle, onCommit, onCancel, cancel } = setup();
		cancel();
		cancel();
		handle.dispatchEvent(pointer('pointerup', 100));
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onCommit).not.toHaveBeenCalled();
	});

	it('захватывает указатель, если API есть', () => {
		const handle = document.createElement('span');
		const capture = vi.fn();
		handle.setPointerCapture = capture;
		startColumnResize({
			handle,
			pointerId: 7,
			startX: 0,
			startWidth: 100,
			minWidth: 60,
			onMove: vi.fn(),
			onCommit: vi.fn(),
			onCancel: vi.fn()
		});
		expect(capture).toHaveBeenCalledExactlyOnceWith(7);
	});
});
