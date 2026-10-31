import { MultiSelectFacade } from './multiselect';
import { MultiSelectContent } from './multiselect-content';
import { MultiSelectRoot } from './multiselect-root';
import { MultiSelectTrigger } from './multiselect-trigger';

export type { MultiSelectProps } from './multiselect';
export type { MultiSelectContentProps } from './multiselect-content';
export type { ChipsOverflow } from './multiselect-context';
export type { MultiSelectRootProps } from './multiselect-root';
export type { MultiSelectTriggerProps } from './multiselect-trigger';
export type { MultiSelectValue } from './multiselect-value';

/** Быстрая форма `<MultiSelect items=… />`; части для своей раскладки: `MultiSelect.Root`, `MultiSelect.Trigger`, `MultiSelect.Content`. */
export const MultiSelect = Object.assign(MultiSelectFacade, {
	Root: MultiSelectRoot,
	Trigger: MultiSelectTrigger,
	Content: MultiSelectContent
});
