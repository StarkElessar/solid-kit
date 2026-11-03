import { type RowKey } from '@stark/solid-kit/grid';
import { TreeList } from '@stark/solid-kit/tree-list';
import { batch, createSignal, type JSX } from 'solid-js';

import { makeTreeDocs, type TreeDoc } from './demo-tree-data';
import { TREE_COLUMNS } from './tree-list-columns';

const ALL = makeTreeDocs(600);
const DELAY_MS = 400;

/** Ленивая подгрузка: при старте только корни, дети узла приходят через 400 мс после раскрытия. */
export function DemoTreeListLazy(): JSX.Element {
	const [rows, setRows] = createSignal<readonly TreeDoc[]>(ALL.filter((doc) => doc.parentId === null));
	const [loading, setLoading] = createSignal<ReadonlySet<RowKey>>(new Set());
	const [calls, setCalls] = createSignal(0);
	return (
		<div>
			<div class='toolbar'>
				<span>Запросов детей: <b data-tree-lazy-calls>{calls()}</b></span>
			</div>
			<div class='grid-frame' data-tree-lazy-demo>
				<TreeList
					fill
					rows={rows()}
					getRowKey={(row) => row.id}
					getParentKey={(row) => row.parentId}
					hasChildren={(row) => row.hasKids}
					loadChildren={(row) => {
						setCalls((count) => count + 1);
						setLoading((current) => new Set(current).add(row.id));
						window.setTimeout(() => {
							batch(() => {
								setRows((current) => [...current, ...ALL.filter((doc) => doc.parentId === row.id)]);
								setLoading((current) => {
									const next = new Set(current);
									next.delete(row.id);
									return next;
								});
							});
						}, DELAY_MS);
					}}
					loadingKeys={loading()}
					columns={TREE_COLUMNS}
					aria-label='Документы, ленивая подгрузка'
				/>
			</div>
		</div>
	);
}
