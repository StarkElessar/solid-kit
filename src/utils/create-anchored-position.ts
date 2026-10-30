import { autoUpdate, computePosition, flip, offset, type Placement, shift, size, type VirtualElement } from '@floating-ui/dom';
import { type Accessor, createEffect, onCleanup } from 'solid-js';

/** Реальный элемент или виртуальный (точка клика ContextMenu). */
export type AnchorElement = Element | VirtualElement;

export interface AnchoredPositionOptions {
	anchor: Accessor<AnchorElement | undefined>;
	floating: Accessor<HTMLElement | undefined>;
	open: Accessor<boolean>;
	/** По умолчанию `bottom-start`. */
	placement?: Placement | undefined;
	/** Зазор между якорем и панелью, по умолчанию 4. */
	gap?: number | undefined;
	/** Отступ от краёв вьюпорта для flip/shift/size, по умолчанию 8. */
	padding?: number | undefined;
	/** Ширина панели равна ширине якоря (разделы 6.2 и 8 спека). */
	matchAnchorWidth?: boolean | undefined;
}

/**
 * Позиционирование плавающей панели поверх `@floating-ui/dom`. Панель показывается в top layer
 * (createPanelLayer), поэтому позиция `fixed` считается относительно вьюпорта.
 */
export function createAnchoredPosition(options: AnchoredPositionOptions): void {
	createEffect(() => {
		const anchor = options.anchor();
		const floating = options.floating();
		if (!options.open() || !anchor || !floating) {
			return;
		}

		const padding = options.padding ?? 8;
		let active = true;

		const update = (): void => {
			void computePosition(anchor, floating, {
				placement: options.placement ?? 'bottom-start',
				strategy: 'fixed',
				middleware: [
					offset(options.gap ?? 4),
					flip({ padding }),
					shift({ padding }),
					size({
						padding,
						apply({ availableHeight, rects, elements }) {
							elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
							if (options.matchAnchorWidth) {
								elements.floating.style.width = `${rects.reference.width}px`;
							}
						}
					})
				]
			}).then(({ x, y }) => {
				if (active) {
					Object.assign(floating.style, { position: 'fixed', left: `${x}px`, top: `${y}px` });
				}
			});
		};

		const stop = autoUpdate(anchor, floating, update);
		onCleanup(() => {
			active = false;
			stop();
		});
	});
}
