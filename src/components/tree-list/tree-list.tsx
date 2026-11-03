import { createMemo, type JSX, splitProps } from 'solid-js';

import { createControllableSignal } from '../../utils/create-controllable-signal';
import { DEFAULT_LEVEL_LABELS } from '../grid/default-level-labels';
import { GridBase } from '../grid/grid-base';
import type { GridTreeSource } from '../grid/grid-tree-source';
import type { RowKey } from '../grid/row-key';
import { toggleKey } from '../grid/selection-state';

import { allTreeKeys } from './all-tree-keys';
import { buildTreeIndex } from './build-tree-index';
import { collapseTreeLevelKeys } from './collapse-tree-level-keys';
import { expandTreeLevelKeys } from './expand-tree-level-keys';
import { flattenTree } from './flatten-tree';
import type { TreeListProps } from './tree-list-props';

const NO_KEYS: ReadonlySet<RowKey> = new Set();
const NO_ROWS: readonly never[] = [];
const NO_PARENT = (): undefined => undefined;

/**
 * Иерархическая таблица: тот же движок, что у Grid (`GridBase`), строки образуют дерево. Раскрытость хранит TreeList, плоский список
 * видимых узлов строит `flattenTree`, всё остальное (колонки, выбор, меню, виртуализация, футер) это общий код грида.
 */
export function TreeList<T>(props: TreeListProps<T>): JSX.Element {
	const [local, grid] = splitProps(props, [
		'rows',
		'getParentKey',
		'loadChildren',
		'hasChildren',
		'expandedKeys',
		'defaultExpandedKeys',
		'onExpandedKeysChange',
		'loadingKeys',
		'levelLabels'
	]);
	const [expanded, setExpanded] = createControllableSignal<ReadonlySet<RowKey>>({
		name: 'TreeList',
		value: () => local.expandedKeys,
		defaultValue: () => local.defaultExpandedKeys ?? NO_KEYS,
		onChange: (next) => local.onExpandedKeysChange?.(next)
	});
	const index = createMemo(() => buildTreeIndex(local.rows ?? NO_ROWS, props.getRowKey, local.getParentKey ?? NO_PARENT));
	const flat = createMemo(() => flattenTree(index(), expanded(), local.hasChildren, local.loadingKeys ?? NO_KEYS));
	// изменение набора сообщается, только если оно есть: кнопки уровней на краю ничего не делают
	const change = (next: ReadonlySet<RowKey>): void => {
		if (next !== expanded()) {
			setExpanded(next);
		}
	};
	const source: GridTreeSource<T> = {
		flat,
		hasNodes: () => flat().items.length > 0,
		toggleNode: (key) => {
			change(toggleKey(expanded(), key));
		},
		loadNode: () => undefined,
		collapseLevel: () => {
			change(collapseTreeLevelKeys(flat().items, expanded()));
		},
		collapseAll: () => {
			change(expanded().size === 0 ? expanded() : NO_KEYS);
		},
		expandLevel: () => {
			change(expandTreeLevelKeys(flat().items, expanded()));
		},
		expandAll: () => {
			change(allTreeKeys(index()));
		},
		levelLabels: () => ({ ...DEFAULT_LEVEL_LABELS, ...local.levelLabels })
	};
	return <GridBase {...grid} tree={source}/>;
}
