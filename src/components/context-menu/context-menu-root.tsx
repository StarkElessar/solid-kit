import { createComputed, createSignal, type JSX } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { ContextMenuContext, type ContextMenuContextValue, type MenuOpenSource } from './context-menu-context';
import type { ContextMenuPoint } from './context-menu-point';

export interface ContextMenuRootProps {
	open?: boolean | undefined;
	defaultOpen?: boolean | undefined;
	onOpenChange?: ((open: boolean) => void) | undefined;
	/** Точка, заданная снаружи (контекстное меню строки грида): тогда `ContextMenu.Trigger` не нужен. Без точки меню не показывается. */
	anchorPoint?: ContextMenuPoint | null | undefined;
	children?: JSX.Element;
}

export function ContextMenuRoot(props: ContextMenuRootProps): JSX.Element {
	const [open, setOpen] = createControllableSignal<boolean>({
		name: 'ContextMenu',
		value: () => props.open,
		defaultValue: () => props.defaultOpen ?? false,
		onChange: (next) => props.onOpenChange?.(next)
	});
	const [ownPoint, setOwnPoint] = createSignal<ContextMenuPoint>();
	const [source, setSource] = createSignal<MenuOpenSource>('pointer');
	const [area, setArea] = createSignal<HTMLElement>();
	const [opener, setOpener] = createSignal<Element>();

	// фокус запоминается до того, как панель его заберёт: вычисление выполняется раньше эффектов панели
	let wasOpen = false;
	createComputed(() => {
		const isOpen = open();
		if (isOpen && !wasOpen) {
			const active = document.activeElement;
			setOpener(active instanceof HTMLElement && active !== document.body ? active : undefined);
		}
		wasOpen = isOpen;
	});

	const context: ContextMenuContextValue = {
		open,
		setOpen,
		openAt: (point, openSource) => {
			setOwnPoint(point);
			setSource(openSource);
			setOpen(true);
		},
		point: () => props.anchorPoint ?? ownPoint(),
		source,
		area,
		setArea: (element) => {
			setArea(element);
		},
		opener
	};

	return <ContextMenuContext.Provider value={context}>{props.children}</ContextMenuContext.Provider>;
}
