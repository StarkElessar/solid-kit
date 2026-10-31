import { ComboboxFacade } from './combobox';
import { ComboboxContent } from './combobox-content';
import { ComboboxInput } from './combobox-input';
import { ComboboxRoot } from './combobox-root';

export type { ComboboxProps } from './combobox';
export type { ComboboxContentProps } from './combobox-content';
export type { ComboboxInputProps } from './combobox-input';
export type { ComboboxQueryReason } from './combobox-query-reason';
export type { ComboboxRootProps } from './combobox-root';

/** Быстрая форма `<Combobox items=… />`; части для своей раскладки: `Combobox.Root`, `Combobox.Input`, `Combobox.Content`. */
export const Combobox = Object.assign(ComboboxFacade, {
	Root: ComboboxRoot,
	Input: ComboboxInput,
	Content: ComboboxContent
});
