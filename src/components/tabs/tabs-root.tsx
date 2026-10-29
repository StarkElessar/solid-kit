import { createMemo, createSignal, createUniqueId, type JSX, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';

import { TabsContext, type TabsContextValue } from './tabs-context';
import type { TabEntry } from './tabs-entry';

export interface TabsRootProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'style'> {
	value?: string | null | undefined;
	defaultValue?: string | null | undefined;
	onValueChange?: ((value: string) => void) | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}

export function TabsRoot(props: TabsRootProps): JSX.Element {
	const [local, rest] = splitProps(props, ['value', 'defaultValue', 'onValueChange', 'class', 'style']);
	const baseId = createUniqueId();

	const [value, setValue] = createControllableSignal<string | null>({
		name: 'Tabs',
		value: () => local.value,
		defaultValue: () => local.defaultValue ?? null,
		onChange: (next) => {
			if (next !== null) {
				local.onValueChange?.(next);
			}
		}
	});

	const [entries, setEntries] = createSignal<readonly TabEntry[]>([]);
	const tabbableValue = createMemo(() => {
		const enabled = entries().filter((entry) => !entry.disabled());
		const selected = enabled.find((entry) => entry.value() === value());
		return (selected ?? enabled[0])?.value() ?? null;
	});

	const context: TabsContextValue = {
		baseId,
		value,
		select: (next) => {
			if (next !== value()) {
				setValue(next);
			}
		},
		tabbableValue,
		register: (entry) => {
			setEntries((list) => [...list, entry]);
			return () => {
				setEntries((list) => list.filter((item) => item !== entry));
			};
		}
	};

	return (
		<TabsContext.Provider value={context}>
			<div {...rest} class={local.class} style={local.style}/>
		</TabsContext.Provider>
	);
}
