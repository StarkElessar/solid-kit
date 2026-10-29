import styles from './tabs.module.css';

import { type JSX, splitProps } from 'solid-js';

import { useTabsContext } from './tabs-context';
import { nextTabIndex } from './tabs-navigation';

export type TabsListSize = 'sm' | 'md' | 'lg';

export interface TabsListProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'role' | 'onKeyDown'> {
	size?: TabsListSize | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
	onKeyDown?: JSX.EventHandler<HTMLDivElement, KeyboardEvent> | undefined;
}

export function TabsList(props: TabsListProps): JSX.Element {
	const tabs = useTabsContext('Tabs.List');
	const [local, rest] = splitProps(props, ['size', 'class', 'style', 'onKeyDown']);

	const handleKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (event) => {
		local.onKeyDown?.(event);
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}
		const current = event.target.closest<HTMLElement>('[role="tab"]');
		if (!current) {
			return;
		}
		const enabled = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not(:disabled)')];
		const index = nextTabIndex(event.key, enabled.indexOf(current), enabled.length);
		const target = index === null ? undefined : enabled[index];
		if (!target) {
			return;
		}
		event.preventDefault();
		target.focus();
		const value = target.dataset['tabValue'];
		if (value !== undefined) {
			tabs.select(value);
		}
	};

	return (
		<div
			{...rest}
			role='tablist'
			data-s-kit
			data-s-kit-size={local.size}
			data-s-kit-focus-inset
			class={local.class ? `${styles['list']} ${local.class}` : styles['list']}
			style={local.style}
			onKeyDown={handleKeyDown}
		/>
	);
}
