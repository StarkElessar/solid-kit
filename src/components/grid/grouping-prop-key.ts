/** Пропсы Grid про группировку: у TreeList их нет (спек TreeList, раздел 3). `rows` исключён, чтобы описать его заново для дерева. */
export type GroupingPropKey =
	| 'rows'
	| 'groups'
	| 'groupable'
	| 'grouping'
	| 'defaultGrouping'
	| 'onGroupingChange'
	| 'groupSort'
	| 'defaultGroupSort'
	| 'onGroupSortChange'
	| 'expandedGroupKeys'
	| 'defaultExpandedGroupKeys'
	| 'onExpandedGroupKeysChange'
	| 'onGroupExpand'
	| 'groupingLabels';
