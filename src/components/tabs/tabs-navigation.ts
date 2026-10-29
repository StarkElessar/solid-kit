/**
 * Индекс вкладки, на которую ведёт клавиша, среди `count` доступных вкладок; `null`, если клавиша не навигационная.
 * Стрелки идут по кругу; если текущая вкладка неизвестна (`current` < 0), ArrowRight начинает с первой, ArrowLeft с последней.
 */
export function nextTabIndex(key: string, current: number, count: number): number | null {
	if (count === 0) {
		return null;
	}
	if (key === 'ArrowRight') {
		return current < 0 ? 0 : (current + 1) % count;
	}
	if (key === 'ArrowLeft') {
		return current < 0 ? count - 1 : (current - 1 + count) % count;
	}
	if (key === 'Home') {
		return 0;
	}
	if (key === 'End') {
		return count - 1;
	}
	return null;
}
