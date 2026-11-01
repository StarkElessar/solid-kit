import type { GridColumn } from './grid-column';

/**
 * Колонки с `hidden` и `locked`, выставленными по наборам грида. Колонка, чьи флаги уже совпадают, возвращается тем же объектом:
 * шапка и ячейки, привязанные к ссылке, не пересоздаются от чужих переключений.
 */
export function applyColumnState<T>(
	columns: readonly GridColumn<T>[],
	hidden: ReadonlySet<string>,
	locked: ReadonlySet<string>
): readonly GridColumn<T>[] {
	return columns.map((column) => {
		const isHidden = hidden.has(column.id);
		const isLocked = locked.has(column.id);

		if ((column.hidden === true) === isHidden && (column.locked === true) === isLocked) {
			return column;
		}

		return { ...column, hidden: isHidden, locked: isLocked };
	});
}
