import { ToggleGroupItem } from './toggle-group-item';
import { ToggleGroupRoot } from './toggle-group-root';

export type { ToggleGroupItemProps } from './toggle-group-item';
export type { ToggleGroupBaseProps, ToggleGroupMultiProps, ToggleGroupRootProps, ToggleGroupSingleProps } from './toggle-group-root';
export type { ToggleGroupMode } from './toggle-group-selection';

export const ToggleGroup = { Root: ToggleGroupRoot, Item: ToggleGroupItem };
