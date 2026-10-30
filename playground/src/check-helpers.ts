/** Ждёт `count` кадров отрисовки: панели в top layer и позиция от Floating UI появляются после микрозадач и кадра. */
export async function frames(count = 3): Promise<void> {
	for (let index = 0; index < count; index++) {
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				resolve();
			});
		});
	}
}

/** Элемент страницы по селектору; отсутствие это ошибка стенда, а не провал проверки. */
export function required(root: ParentNode, selector: string): HTMLElement {
	const found = root.querySelector<HTMLElement>(selector);
	if (!found) {
		throw new Error(`Playground element is missing: ${selector}`);
	}
	return found;
}

/** Синтетический Esc для стека слоёв: годится, чтобы закрыть панель между проверками (приёмка Esc идёт настоящими клавишами). */
export function closeWithEscape(): void {
	document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
}
