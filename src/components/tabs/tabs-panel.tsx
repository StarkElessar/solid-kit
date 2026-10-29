import styles from './tabs.module.css';

import { type JSX, Show, splitProps } from 'solid-js';

import { useTabsContext } from './tabs-context';
import { panelId, tabId } from './tabs-ids';

export interface TabsPanelProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'role'> {
	value: string;
	/** Содержимое невыбранной панели остаётся в DOM (скрытое), состояние внутри не теряется. */
	keepMounted?: boolean | undefined;
	class?: string | undefined;
}

export function TabsPanel(props: TabsPanelProps): JSX.Element {
	const tabs = useTabsContext('Tabs.Panel');
	const [local, rest] = splitProps(props, ['value', 'keepMounted', 'class', 'children']);
	const selected = (): boolean => tabs.value() === local.value;

	return (
		<div
			tabindex={0}
			{...rest}
			role='tabpanel'
			id={panelId(tabs.baseId, local.value)}
			aria-labelledby={tabId(tabs.baseId, local.value)}
			hidden={!selected()}
			class={local.class ? `${styles['panel']} ${local.class}` : styles['panel']}
		>
			<Show when={selected() || local.keepMounted === true}>{local.children}</Show>
		</div>
	);
}
