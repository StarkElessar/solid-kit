import styles from './tabs.module.css';

import { createEffect, type JSX, on, onCleanup, onMount, splitProps } from 'solid-js';

import { revealInScroller } from './reveal-in-scroller';
import { useTabsContext } from './tabs-context';
import { panelId, tabId } from './tabs-ids';

export interface TabsTabProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'class' | 'role' | 'type' | 'onClick' | 'onFocus'> {
	value: string;
	class?: string | undefined;
	onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent> | undefined;
	onFocus?: JSX.EventHandler<HTMLButtonElement, FocusEvent> | undefined;
}

export function TabsTab(props: TabsTabProps): JSX.Element {
	const tabs = useTabsContext('Tabs.Tab');
	const [local, rest] = splitProps(props, ['value', 'disabled', 'class', 'onClick', 'onFocus']);
	const selected = (): boolean => tabs.value() === local.value;
	let element: HTMLButtonElement | undefined;

	const reveal = (): void => {
		const scroller = element?.closest<HTMLElement>('[role="tablist"]');
		if (element && scroller) {
			revealInScroller(element, scroller);
		}
	};

	onCleanup(tabs.register({ value: () => local.value, disabled: () => local.disabled === true }));
	// выбор сменили не фокусом (например, родитель): вкладка прокручивается в видимую область; выбранная при первом показе тоже
	createEffect(on(selected, (isSelected) => {
		if (isSelected) {
			reveal();
		}
	}, { defer: true }));
	onMount(() => {
		if (selected()) {
			reveal();
		}
	});

	return (
		<button
			{...rest}
			ref={element}
			type='button'
			role='tab'
			id={tabId(tabs.baseId, local.value)}
			aria-selected={selected()}
			aria-controls={panelId(tabs.baseId, local.value)}
			tabindex={tabs.tabbableValue() === local.value ? 0 : -1}
			data-tab-value={local.value}
			disabled={local.disabled}
			class={local.class ? `${styles['tab']} ${local.class}` : styles['tab']}
			onClick={(event) => {
				local.onClick?.(event);
				if (!event.defaultPrevented) {
					tabs.select(local.value);
				}
			}}
			onFocus={(event) => {
				local.onFocus?.(event);
				reveal();
			}}
		/>
	);
}
