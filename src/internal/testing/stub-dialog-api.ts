import { vi } from 'vitest';

export interface DialogApiStub {
	/** Возвращает прототип в исходное состояние и сбрасывает очередь событий. */
	restore: () => void;
	/** Доставляет накопленные события `close`: браузер шлёт их отдельной задачей позже вызова `close()`. */
	flush: () => void;
}

/**
 * Тестовый адаптер диалога: в jsdom нет `showModal`, `close` и событий диалога. `showModal` выставляет атрибут `open`
 * (у отсоединённого элемента и у уже открытого бросает `InvalidStateError`, как браузер), `close` убирает его и ставит событие
 * `close` в очередь: доставка отложена до `flush()`, как в браузере, иначе тесты не заметят гонок с повторным открытием.
 */
export function stubDialogApi(): DialogApiStub {
	const prototype = HTMLDialogElement.prototype;
	// методы прототипа сохраняются только для восстановления и вызываются на элементах, поэтому `this` не теряется
	// eslint-disable-next-line @typescript-eslint/unbound-method
	const original = { showModal: prototype.showModal, close: prototype.close };
	let queue: HTMLDialogElement[] = [];

	prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
		if (!this.isConnected || this.hasAttribute('open')) {
			throw new DOMException('The dialog cannot be shown modally', 'InvalidStateError');
		}
		this.setAttribute('open', '');
	});
	prototype.close = vi.fn(function (this: HTMLDialogElement) {
		if (!this.hasAttribute('open')) {
			return;
		}
		this.removeAttribute('open');
		queue.push(this);
	});

	return {
		restore: () => {
			prototype.showModal = original.showModal;
			prototype.close = original.close;
			queue = [];
		},
		flush: () => {
			const pending = queue;
			queue = [];
			for (const dialog of pending) {
				dialog.dispatchEvent(new Event('close'));
			}
		}
	};
}
