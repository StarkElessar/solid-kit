/** Направление порядка групп колонки группировки. */
export type GridGroupDirection = 'asc' | 'desc';

/** Направления групп по id колонки; колонки без записи идут по `GridColumn.groupSortDirection`, иначе по возрастанию. */
export type GridGroupSort = Readonly<Record<string, GridGroupDirection>>;
