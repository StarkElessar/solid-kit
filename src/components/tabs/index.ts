import { TabsList } from './tabs-list';
import { TabsPanel } from './tabs-panel';
import { TabsRoot } from './tabs-root';
import { TabsTab } from './tabs-tab';

export type { TabsListProps, TabsListSize } from './tabs-list';
export type { TabsPanelProps } from './tabs-panel';
export type { TabsRootProps } from './tabs-root';
export type { TabsTabProps } from './tabs-tab';

export const Tabs = { Root: TabsRoot, List: TabsList, Tab: TabsTab, Panel: TabsPanel };
