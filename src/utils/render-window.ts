import type { Accessor } from 'solid-js';

export type ScrollAlign = 'auto' | 'start' | 'center' | 'end';

export interface RenderWindowItem {
	/** Индекс строки в плоском списке. */
	readonly index: number;
	/** Смещение сверху, px (для отступов-spacer). */
	readonly start: number;
	readonly size: number;
}

/** Окно рендера: какие строки сейчас нужно показать. ListBox и грид зависят от этого интерфейса, а не от TanStack. */
export interface RenderWindow {
	items: Accessor<readonly RenderWindowItem[]>;
	totalSize: Accessor<number>;
	/** Ref строки; строке нужен атрибут `data-index`. */
	measure: (element: HTMLElement) => void;
	scrollToIndex: (index: number, options?: { align?: ScrollAlign }) => void;
}

export interface RenderWindowOptions {
	count: Accessor<number>;
	scroller: Accessor<HTMLElement | undefined>;
	/** Стартовая оценка высоты строки (раздел 6 зонтичного). */
	estimateSize: (index: number) => number;
	/** Сколько строк рендерить за пределами видимой области; по умолчанию у списков 6. */
	overscan: number;
	/** Высота липкого заголовка группы: учитывается при прокрутке к строке. */
	scrollPaddingStart?: Accessor<number> | undefined;
	/**
	 * Расстояние от начала скроллера до начала списка, px: у грида это липкая шапка в том же скроллере. `start` строк и `totalSize()`
	 * по-прежнему отсчитываются от начала списка. Полное окно его игнорирует.
	 */
	scrollMargin?: Accessor<number> | undefined;
	/** Отступ снизу скроллера (его padding): без него опция у нижнего края прокручивается внахлёст на padding. */
	scrollPaddingEnd?: Accessor<number> | undefined;
	/** Высота окна до первого измерения скроллера, px: первый кадр не рендерит пустой список. Полное окно игнорирует. */
	initialHeight?: Accessor<number> | undefined;
}
