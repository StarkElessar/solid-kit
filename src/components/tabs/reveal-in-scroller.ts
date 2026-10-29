/** Прокручивает горизонтальный скроллер ровно настолько, чтобы элемент оказался в его видимой области; страницу не двигает. */
export function revealInScroller(item: Element, scroller: HTMLElement): void {
	const itemRect = item.getBoundingClientRect();
	const scrollerRect = scroller.getBoundingClientRect();
	if (itemRect.left < scrollerRect.left) {
		scroller.scrollLeft -= scrollerRect.left - itemRect.left;
	}
	else if (itemRect.right > scrollerRect.right) {
		scroller.scrollLeft += itemRect.right - scrollerRect.right;
	}
}
