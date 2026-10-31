import { vi } from 'vitest';

export interface ListGeometryOptions {
	/** Высота строки (элемента с `data-index`), px; по умолчанию 20. */
	rowHeight?: number;
	/** Высота скроллера списка (`role="listbox"`), px; по умолчанию 100. */
	viewportHeight?: number;
}

/**
 * Тестовая геометрия: в jsdom нет раскладки, поэтому виртуализатор ничего не покажет. Подставляет высоту окна скроллера
 * (`clientHeight`), предел прокрутки (`scrollHeight`), высоту строк с `data-index` (`offsetHeight`, `getBoundingClientRect`) и `scrollTo`,
 * который двигает `scrollTop` и шлёт `scroll`. Шпионы снимает `restoreMocks`; `scrollTo` возвращается функцией `uninstall`.
 */
export function installListGeometry(options: ListGeometryOptions = {}): () => void {
	const rowHeight = options.rowHeight ?? 20;
	const viewportHeight = options.viewportHeight ?? 100;
	const isScroller = (element: Element): boolean => element.getAttribute('role') === 'listbox';

	vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
		return isScroller(this) ? viewportHeight : 0;
	});
	vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(function (this: Element) {
		return isScroller(this) ? 200 : 0;
	});
	vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
		return isScroller(this) ? 100_000_000 : 0;
	});
	vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
		return this.hasAttribute('data-index') ? rowHeight : 0;
	});
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
		const height = this.hasAttribute('data-index') ? rowHeight : 0;
		return { x: 0, y: 0, top: 0, left: 0, right: 200, bottom: height, width: 200, height, toJSON: () => ({}) };
	});

	const hadScrollTo = 'scrollTo' in Element.prototype;
	// eslint-disable-next-line @typescript-eslint/unbound-method
	const original = Element.prototype.scrollTo;
	Element.prototype.scrollTo = function (this: Element, scrollOptions?: ScrollToOptions | number): void {
		const top = typeof scrollOptions === 'object' ? (scrollOptions.top ?? 0) : 0;
		this.scrollTop = top;
		this.dispatchEvent(new Event('scroll'));
	};

	return () => {
		if (hadScrollTo) {
			Element.prototype.scrollTo = original;
		}
		else {
			Reflect.deleteProperty(Element.prototype, 'scrollTo');
		}
	};
}
