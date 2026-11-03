import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { useGrid } from './grid-context';
import { GridExpander } from './grid-expander';
import type { GridNode } from './grid-node';

export interface GridNodeContentProps {
	node: GridNode;
	/** Текст ячейки: имя узла в подписи шеврона. */
	title: string;
	children: JSX.Element;
}

/** Содержимое ячейки дерева: шеврон (или пустое место под него у листа) и значение ячейки. */
export function GridNodeContent(props: GridNodeContentProps): JSX.Element {
	const grid = useGrid();
	return (
		<span class={styles['node']}>
			<Show when={props.node.expandable} fallback={<span class={styles['expander-gap']} aria-hidden='true'/>}>
				<GridExpander
					expanded={props.node.expanded}
					label={props.node.expanded ? grid.levelLabels().collapse(props.title) : grid.levelLabels().expand(props.title)}
					onToggle={() => {
						grid.toggleNode(props.node.key);
					}}
				/>
			</Show>
			<span class={styles['node-text']}>{props.children}</span>
		</span>
	);
}
