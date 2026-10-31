import { type JSX, splitProps } from 'solid-js';

import { MultiSelectContent, type MultiSelectContentProps } from './multiselect-content';
import { MultiSelectRoot, type MultiSelectRootProps } from './multiselect-root';
import { MultiSelectTrigger, type MultiSelectTriggerProps } from './multiselect-trigger';

export interface MultiSelectProps<T>
	extends Omit<MultiSelectRootProps<T>, 'children'>,
	Omit<MultiSelectTriggerProps<T>, 'ref'>,
	Omit<MultiSelectContentProps<T>, 'class' | 'style' | 'ref'> {
	/** Класс и стиль панели; `class` и `style` относятся к оболочке триггера. */
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
	'query',
	'defaultQuery',
	'onQueryChange',
	'filter',
	'loading',
	'virtualized',
	'overscan',
	'disabled',
	'size',
	'total',
	'allKey',
	'allLabel',
	'chipsOverflow'
] as const;

const CONTENT_KEYS = [
	'renderOption',
	'renderGroupHeader',
	'loadingText',
	'emptyText',
	'contentClass',
	'contentStyle'
] as const;

/** Быстрая форма: собирает `Root`, `Trigger` и `Content` из одного набора пропсов. */
export function MultiSelectFacade<T>(props: MultiSelectProps<T>): JSX.Element {
	const [root, afterRoot] = splitProps(props, ROOT_KEYS);
	const [content, trigger] = splitProps(afterRoot, CONTENT_KEYS);

	return (
		<MultiSelectRoot<T> {...root}>
			<MultiSelectTrigger<T> {...trigger}/>
			<MultiSelectContent<T>
				renderOption={content.renderOption}
				renderGroupHeader={content.renderGroupHeader}
				loadingText={content.loadingText}
				emptyText={content.emptyText}
				class={content.contentClass}
				style={content.contentStyle}
			/>
		</MultiSelectRoot>
	);
}
