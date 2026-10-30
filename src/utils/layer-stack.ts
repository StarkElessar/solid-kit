/**
 * Открытый слой (панель или диалог). Раздел 8 спека: Esc обрабатывает только верхний слой,
 * клик снаружи каскадно закрывает слои сверху вниз.
 */
export interface Layer {
	/** Принадлежит ли цель события слою (его панель или его инициатор). */
	contains: (target: Node) => boolean;
	/** Запрос закрытия; регистрацию снимает владелец слоя. */
	close: () => void;
	/** Модальный слой (Dialog): стек его по клику снаружи не закрывает и дальше вниз не идёт. */
	modal?: boolean;
}

const layers: Layer[] = [];
let listening = false;

function onKeyDown(event: KeyboardEvent): void {
	const top = layers.at(-1);
	if (event.key !== 'Escape' || !top) {
		return;
	}
	// фаза захвата на document: раньше любых обработчиков панели и делегированных обработчиков Solid
	event.preventDefault();
	event.stopPropagation();
	top.close();
}

function onPointerDown(event: PointerEvent): void {
	if (!(event.target instanceof Node)) {
		return;
	}
	const target = event.target;
	// обход по копии: close() слоя может синхронно снять регистрацию и изменить стек
	for (const layer of [...layers].reverse()) {
		// слой мог быть снят закрытием вышележащего слоя: уже не зарегистрированному close() не вызываем
		if (!layers.includes(layer)) {
			continue;
		}
		if (layer.contains(target) || layer.modal) {
			return;
		}
		layer.close();
	}
}

function startListening(): void {
	document.addEventListener('keydown', onKeyDown, true);
	document.addEventListener('pointerdown', onPointerDown, true);
	listening = true;
}

function stopListening(): void {
	document.removeEventListener('keydown', onKeyDown, true);
	document.removeEventListener('pointerdown', onPointerDown, true);
	listening = false;
}

/** Кладёт слой на вершину стека. Возвращает функцию снятия; повторный вызов безопасен. */
export function registerLayer(layer: Layer): () => void {
	layers.push(layer);
	if (!listening) {
		startListening();
	}
	return () => {
		const index = layers.indexOf(layer);
		if (index === -1) {
			return;
		}
		layers.splice(index, 1);
		if (layers.length === 0) {
			stopListening();
		}
	};
}

export function getLayerCount(): number {
	return layers.length;
}
