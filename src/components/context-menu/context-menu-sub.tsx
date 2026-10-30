import { createEffect, createSignal, createUniqueId, type JSX, untrack } from 'solid-js';

import type { MenuOpenSource } from './context-menu-context';
import { useMenuLevelContext } from './menu-level-context';
import { SubContext, type SubContextValue } from './sub-context';

export interface ContextMenuSubProps {
	children?: JSX.Element;
}

/** Состояние одного подменю: открыто ли оно, чем открыто и какой пункт его вызывает. */
export function ContextMenuSub(props: ContextMenuSubProps): JSX.Element {
	const level = useMenuLevelContext('ContextMenu.Sub');
	const [open, setOpenState] = createSignal(false);
	const [source, setSource] = createSignal<MenuOpenSource>('pointer');
	const [trigger, setTrigger] = createSignal<HTMLElement>();
	const id = createUniqueId();

	// фокус ушёл на другой пункт родительского меню: подменю закрывается (фокус внутри подменю активный пункт родителя не меняет)
	createEffect(() => {
		const active = level.activeItem();
		if (active && active !== trigger() && untrack(open)) {
			setOpenState(false);
		}
	});

	const context: SubContextValue = {
		open,
		source,
		setOpen: (next, nextSource = 'pointer') => {
			if (next) {
				setSource(nextSource);
			}
			setOpenState(next);
		},
		trigger,
		setTrigger: (element) => {
			setTrigger(element);
		},
		triggerId: `${id}-trigger`,
		contentId: `${id}-content`
	};

	return <SubContext.Provider value={context}>{props.children}</SubContext.Provider>;
}
