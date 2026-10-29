/** Запись вкладки в реестре `Tabs.Root`: по ней корень определяет, какая вкладка входит в порядок Tab. */
export interface TabEntry {
	value: () => string;
	disabled: () => boolean;
}
