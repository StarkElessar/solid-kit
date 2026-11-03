import type { GridColumn } from '@stark/solid-kit/grid';

import type { TreeDoc } from './demo-tree-data';

/** Колонки демо дерева: первая закреплена и несёт шеврон, остальные дают горизонтальную прокрутку. */
export const TREE_COLUMNS: readonly GridColumn<TreeDoc>[] = [
	{ id: 'title', title: 'Название документа', value: (row) => row.title, width: 280, locked: true },
	{ id: 'type', title: 'Тип', value: (row) => row.type, width: 140 },
	{ id: 'owner', title: 'Владелец', value: (row) => row.owner, width: 220 },
	{ id: 'comment', title: 'Комментарий', value: (row) => row.comment, width: 320 },
	{ id: 'time', title: 'Время', value: (row) => row.time, width: 90, align: 'end' }
];
