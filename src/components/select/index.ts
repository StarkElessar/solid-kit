import { SelectFacade } from './select';
import { SelectContent } from './select-content';
import { SelectRoot } from './select-root';
import { SelectTrigger } from './select-trigger';

export type { SelectProps } from './select';
export type { SelectContentProps } from './select-content';
export type { SelectRootProps } from './select-root';
export type { SelectTriggerProps } from './select-trigger';

/** Быстрая форма `<Select items=… />`; части для своей раскладки: `Select.Root`, `Select.Trigger`, `Select.Content`. */
export const Select = Object.assign(SelectFacade, {
	Root: SelectRoot,
	Trigger: SelectTrigger,
	Content: SelectContent
});
