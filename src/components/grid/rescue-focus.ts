/**
 * Вызывается из очистки компонента, пока его DOM ещё на месте: если фокус был внутри `container`, то после удаления (в микрозадаче) он
 * переносится на запасной элемент, но только когда активным остался `body`. Фокус, успевший уйти на другой элемент, не перехватывается.
 */
export function rescueFocus(container: Element, fallback: () => HTMLElement | undefined): void {
	if (!container.contains(document.activeElement)) {
		return;
	}

	queueMicrotask(() => {
		const active = document.activeElement;

		if (active !== null && active !== document.body) {
			return;
		}

		const target = fallback();

		if (target?.isConnected === true) {
			target.focus({ preventScroll: true });
		}
	});
}
