import { createMemo, type JSX, Match, Switch } from 'solid-js';

import { useGrid } from './grid-context';
import { GridGroupFooterRow } from './grid-group-footer-row';
import { GridGroupRow } from './grid-group-row';
import { GridLoadingGroupRow } from './grid-loading-group-row';
import { GridRow } from './grid-row';

export interface GridItemRowProps {
	/** Индекс элемента тела. */
	index: number;
}

/** Строка тела по виду элемента на этом индексе: сдвиг индексов при разворачивании меняет вид, а не пересоздаёт всё окно. */
export function GridItemRow(props: GridItemRowProps): JSX.Element {
	const grid = useGrid();
	const kind = createMemo(() => grid.itemAt(props.index)?.kind);
	return (
		<Switch>
			<Match when={kind() === 'row'}><GridRow index={props.index}/></Match>
			<Match when={kind() === 'group'}><GridGroupRow index={props.index}/></Match>
			<Match when={kind() === 'footer'}><GridGroupFooterRow index={props.index}/></Match>
			<Match when={kind() === 'loading'}><GridLoadingGroupRow index={props.index}/></Match>
		</Switch>
	);
}
