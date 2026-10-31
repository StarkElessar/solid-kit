import { type JSX, splitProps } from 'solid-js';

import { ComboboxContent, type ComboboxContentProps } from './combobox-content';
import { ComboboxInput, type ComboboxInputProps } from './combobox-input';
import { ComboboxRoot, type ComboboxRootProps } from './combobox-root';

export interface ComboboxProps<T>
	extends Omit<ComboboxRootProps<T>, 'children'>,
	ComboboxInputProps,
	Omit<ComboboxContentProps<T>, 'class' | 'style' | 'ref'> {
	/** Класс и стиль панели; `class` и `style` относятся к оболочке поля. */
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
	'size'
] as const;

const CONTENT_KEYS = ['renderOption', 'renderGroupHeader', 'loadingText', 'emptyText', 'contentClass', 'contentStyle'] as const;

/** Быстрая форма: собирает `Root`, `Input` и `Content` из одного набора пропсов. */
export function ComboboxFacade<T>(props: ComboboxProps<T>): JSX.Element {
	const [root, afterRoot] = splitProps(props, ROOT_KEYS);
	const [content, input] = splitProps(afterRoot, CONTENT_KEYS);

	return (
		<ComboboxRoot<T> {...root}>
			<ComboboxInput {...input}/>
			<ComboboxContent<T>
				renderOption={content.renderOption}
				renderGroupHeader={content.renderGroupHeader}
				loadingText={content.loadingText}
				emptyText={content.emptyText}
				class={content.contentClass}
				style={content.contentStyle}
			/>
		</ComboboxRoot>
	);
}
