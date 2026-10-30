/** Лежит ли точка вне прямоугольника (по границе точка считается внутри). Нужна для клика по подложке диалога. */
export function isOutsideRect(rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>, x: number, y: number): boolean {
	return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
}
