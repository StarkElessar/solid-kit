import styles from './dialog.module.css';

import { createEffect, createSignal, type JSX, Show, splitProps, untrack } from 'solid-js';

import { blocksImplicitSubmit } from '../../internal/floating-panel/blocks-implicit-submit';
import { createFocusRestore } from '../../internal/floating-panel/create-focus-restore';
import { type IsolatedEventProp, isolationHandlers } from '../../internal/floating-panel/panel-isolation';
import { PanelHostContext } from '../../internal/panel/panel-host';
import { PanelPortal } from '../../internal/panel/panel-portal';
import { renderChildren } from '../../internal/render-children';

import { createDialogLayer } from './create-dialog-layer';
import { useDialogContext } from './dialog-context';
import type { DialogState } from './dialog-state';
import { isOutsideRect } from './is-outside-rect';

/** Атрибуты `<dialog>`, кроме занятых компонентом: открытием, событиями изоляции и закрытия, ключевыми пропсами. */
export type DialogContentAttributes = Omit<
	JSX.DialogHtmlAttributes<HTMLDialogElement>,
	IsolatedEventProp | 'onKeyDown' | 'onCancel' | 'onClose' | 'open' | 'ref' | 'class' | 'style' | 'children'
>;

export interface DialogContentProps extends DialogContentAttributes {
	size?: 'sm' | 'md' | 'lg' | undefined;
	/** Вызывается раньше изоляции события; остальные изолируемые события вешаются на элементы внутри. */
	onKeyDown?: ((event: KeyboardEvent & { currentTarget: HTMLDialogElement }) => void) | undefined;
	/** Элемент `<dialog>`. */
	ref?: ((element: HTMLDialogElement) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	children?: JSX.Element | ((state: DialogState) => JSX.Element);
}

export function DialogContent(props: DialogContentProps): JSX.Element {
	const context = useDialogContext('Dialog.Content');
	const [local, rest] = splitProps(props, ['size', 'onKeyDown', 'ref', 'class', 'style', 'children']);
	const [dialog, setDialog] = createSignal<HTMLDialogElement>();
	const [opener, setOpener] = createSignal<Element>();
	const open = (): boolean => context.open();
	const state: DialogState = {
		open: context.open,
		close: () => {
			context.setOpen(false);
		}
	};

	// кто держал фокус до открытия: туда фокус вернётся, даже если инициатора нет (диалог открыт через `open` снаружи)
	createEffect(() => {
		if (!open()) {
			return;
		}
		untrack(() => {
			const active = document.activeElement;
			setOpener(context.anchor() ?? (active instanceof HTMLElement && active !== document.body ? active : undefined));
		});
	});

	createDialogLayer({
		dialog,
		open,
		onEscape: () => {
			if (context.closeOnEscape()) {
				context.setOpen(false);
			}
		}
	});
	createFocusRestore({ panel: dialog, anchor: opener, open });

	// закрытие, пришедшее не от нас (`<form method="dialog">`): синхронизируем состояние. Браузер доставляет `close` отдельной
	// задачей, поэтому событие может прийти от уже удалённого экземпляра (очистка слоя вызвала `close()`, затем диалог открыт снова
	// или размонтирован): такие события игнорируются, иначе новый диалог закрылся бы чужим событием
	const handleClose = (event: Event): void => {
		const element = dialog();
		if (!element?.isConnected || event.currentTarget !== element || !context.open()) {
			return;
		}
		context.setOpen(false);
		// контролируемый режим: родитель оставил `open`, DOM-диалог уже закрыт, поэтому открываем снова
		if (context.open() && !element.open) {
			element.showModal();
		}
	};

	// клик по подложке это пара pointerdown и click, обе цели `<dialog>` вне его прямоугольника: выделение текста,
	// начатое внутри и закончившееся над подложкой, диалог не закрывает
	let pressedOnBackdrop = false;
	const isBackdropEvent = (event: MouseEvent & { currentTarget: HTMLDialogElement }): boolean => {
		return event.target === event.currentTarget
			&& isOutsideRect(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
	};

	return (
		<Show when={context.open()}>
			<PanelPortal anchor={context.anchor}>
				<PanelHostContext.Provider value={dialog}>
					<dialog
						aria-labelledby={context.titleId()}
						aria-describedby={context.descriptionId()}
						{...rest}
						{...isolationHandlers}
						id={context.contentId}
						ref={(element) => {
							setDialog(element);
							local.ref?.(element);
						}}
						data-s-kit
						data-s-kit-dialog
						data-s-kit-size={local.size}
						class={local.class ? `${styles['dialog']} ${local.class}` : styles['dialog']}
						style={local.style}
						onCancel={(event) => {
							// страховка для источников, минующих keydown (close watcher); основной путь это стек слоёв
							event.preventDefault();
						}}
						onClose={(event) => {
							handleClose(event);
						}}
						onPointerDown={(event) => {
							event.stopPropagation();
							pressedOnBackdrop = isBackdropEvent(event);
						}}
						onClick={(event) => {
							event.stopPropagation();
							const closing = pressedOnBackdrop && isBackdropEvent(event) && context.closeOnBackdropClick();
							pressedOnBackdrop = false;
							if (closing) {
								context.setOpen(false);
							}
						}}
						onKeyDown={(event) => {
							local.onKeyDown?.(event);
							if (blocksImplicitSubmit(event, event.currentTarget)) {
								event.preventDefault();
							}
							event.stopPropagation();
						}}
					>
						{renderChildren(local.children, state)}
					</dialog>
				</PanelHostContext.Provider>
			</PanelPortal>
		</Show>
	);
}
