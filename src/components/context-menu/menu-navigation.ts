/** Следующий доступный индекс от `from` в направлении `direction` по кругу; индексы вне массива допустимы как точка отсчёта. */
function step(disabled: readonly boolean[], from: number, direction: 1 | -1): number {
	const count = disabled.length;
	for (let offset = 1; offset <= count; offset++) {
		const index = (((from + direction * offset) % count) + count) % count;
		if (disabled[index] === false) {
			return index;
		}
	}
	return -1;
}

/**
 * Индекс пункта, на который ведёт клавиша; `disabled[i]` истинно, если пункт i недоступен. `null`, если клавиша не навигационная
 * или доступных пунктов нет. Стрелки идут по кругу и пропускают недоступные; без текущего пункта (`current` < 0)
 * ArrowDown берёт первый доступный, ArrowUp последний.
 */
export function nextMenuItemIndex(key: string, current: number, disabled: readonly boolean[]): number | null {
	if (!disabled.includes(false)) {
		return null;
	}
	if (key === 'Home') {
		return step(disabled, -1, 1);
	}
	if (key === 'End') {
		return step(disabled, disabled.length, -1);
	}
	if (key === 'ArrowDown') {
		return step(disabled, current < 0 ? -1 : current, 1);
	}
	if (key === 'ArrowUp') {
		return step(disabled, current < 0 ? disabled.length : current, -1);
	}
	return null;
}
