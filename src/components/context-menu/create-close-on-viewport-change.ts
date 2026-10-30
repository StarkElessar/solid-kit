import { type Accessor, createEffect, onCleanup } from 'solid-js';

export interface CloseOnViewportChangeOptions {
	open: Accessor<boolean>;
	onClose: () => void;
}

/**
 * Меню в точке клика не должно висеть над сдвинувшимся содержимым: прокрутка страницы или любого предка и изменение размера окна
 * закрывают его. Прокрутка внутри самого меню (корень или подменю, атрибут `data-s-kit-menu`) его не закрывает.
 */
export function createCloseOnViewportChange(options: CloseOnViewportChangeOptions): void {
	createEffect(() => {
		if (!options.open()) {
			return;
		}
		const onScroll = (event: Event): void => {
			if (event.target instanceof Element && event.target.closest('[data-s-kit-menu]')) {
				return;
			}
			options.onClose();
		};
		const onResize = (): void => {
			options.onClose();
		};
		// scroll не всплывает: фаза захвата на window видит прокрутку любого элемента
		window.addEventListener('scroll', onScroll, true);
		window.addEventListener('resize', onResize);
		onCleanup(() => {
			window.removeEventListener('scroll', onScroll, true);
			window.removeEventListener('resize', onResize);
		});
	});
}
