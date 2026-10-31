import { getOwner, onCleanup } from 'solid-js';

export interface TypeaheadBuffer {
	/** Добавляет символ и продлевает таймер сброса; возвращает накопленную строку. */
	push: (char: string) => string;
	clear: () => void;
	value: () => string;
}

/** Буфер поиска по набору букв: накопленная строка сбрасывается через `timeoutMs` без нажатий (по умолчанию 500 мс). */
export function createTypeaheadBuffer(timeoutMs = 500): TypeaheadBuffer {
	let buffer = '';
	let timer: ReturnType<typeof setTimeout> | undefined;

	const clear = (): void => {
		buffer = '';
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	if (getOwner()) {
		onCleanup(clear);
	}

	return {
		push: (char) => {
			if (timer !== undefined) {
				clearTimeout(timer);
			}
			buffer += char;
			timer = setTimeout(clear, timeoutMs);
			return buffer;
		},
		clear,
		value: () => buffer
	};
}
