import type { GridColumn } from './grid-column';
import { visibleColumnIds } from './visible-column-ids';

/** Можно ли переключить видимость колонки: скрыть последнюю видимую нельзя, показать скрытую можно всегда. */
export function canHideColumn<T>(columns: readonly GridColumn<T>[], hidden: ReadonlySet<string>, id: string): boolean {
	const visible = visibleColumnIds(columns, hidden);

	return !(visible.length === 1 && visible[0] === id);
}
