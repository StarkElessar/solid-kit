import { type JSX, splitProps } from 'solid-js';

import { SelectContent, type SelectContentProps } from './select-content';
import { SelectRoot, type SelectRootProps } from './select-root';
import { SelectTrigger, type SelectTriggerProps } from './select-trigger';

export interface SelectProps<T>
	extends Omit<SelectRootProps<T>, 'children'>,
	Omit<SelectTriggerProps<T>, 'ref'>,
	Omit<SelectContentProps<T>, 'class' | 'style' | 'ref'> {
	/** Класс и стиль панели; `class` и `style` относятся к триггеру. */
	contentClass?: string | undefined;
	contentStyle?: JSX.CSSProperties | undefined;
}

const ROOT_KEYS = [
	'items',
	'getKey',
	'getLabel',
	'groupBy',
	'isItemDisabled',
	'value',
	'defaultValue',
	'onValueChange',
	'open',
	'defaultOpen',
	'onOpenChange',
	'loading',
	'virtualized',
	'overscan',
	'disabled',
	'size'
] as const;

const CONTENT_KEYS = ['renderOption', 'renderGroupHeader', 'loadingText', 'emptyText', 'contentClass', 'contentStyle'] as const;

/** Быстрая форма: собирает `Root`, `Trigger` и `Content` из одного набора пропсов. */
export function SelectFacade<T>(props: SelectProps<T>): JSX.Element {
	const [root, afterRoot] = splitProps(props, ROOT_KEYS);
	const [content, trigger] = splitProps(afterRoot, CONTENT_KEYS);

	return (
		<SelectRoot<T> {...root}>
			<SelectTrigger<T> {...trigger}/>
			<SelectContent<T>
				renderOption={content.renderOption}
				renderGroupHeader={content.renderGroupHeader}
				loadingText={content.loadingText}
				emptyText={content.emptyText}
				class={content.contentClass}
				style={content.contentStyle}
			/>
		</SelectRoot>
	);
}
