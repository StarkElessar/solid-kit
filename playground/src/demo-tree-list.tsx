import { TreeList } from '@stark/solid-kit/tree-list';
import { createMemo, createSignal, For, type JSX } from 'solid-js';

import { makeTreeDocs } from './demo-tree-data';
import { pick } from './pick';
import { TREE_COLUMNS } from './tree-list-columns';

const SIZES = ['1000', '5000', '20000'] as const;

/** Плоский список с `parentId` целиком (так живёт BackOffice): дерево строит и раскрывает клиент, виртуализация по видимым узлам. */
export function DemoTreeList(): JSX.Element {
	const [size, setSize] = createSignal<(typeof SIZES)[number]>('1000');
	const [selectable, setSelectable] = createSignal(true);
	const [loading, setLoading] = createSignal(false);
	const [empty, setEmpty] = createSignal(false);
	const [refreshes, setRefreshes] = createSignal(0);
	const docs = createMemo(() => makeTreeDocs(Number(size())));
	const rows = () => (empty() ? [] : docs());
	return (
		<div>
			<div class='toolbar'>
				<label>
					Узлов
					<select data-tree-size onChange={(event) => setSize(pick(SIZES, event.currentTarget.value, '1000'))}>
						<For each={SIZES}>{(value) => <option value={value} selected={value === size()}>{value}</option>}</For>
					</select>
				</label>
				<label>
					<input
						type='checkbox'
						data-tree-selectable
						checked={selectable()}
						onChange={(event) => setSelectable(event.currentTarget.checked)}
					/>
					Выбор строк
				</label>
				<label>
					<input
						type='checkbox'
						data-tree-loading
						checked={loading()}
						onChange={(event) => setLoading(event.currentTarget.checked)}
					/>
					Загрузка
				</label>
				<label>
					<input
						type='checkbox'
						data-tree-empty
						checked={empty()}
						onChange={(event) => setEmpty(event.currentTarget.checked)}
					/>
					Пусто
				</label>
				<span>Обновлений: <b data-tree-refresh>{refreshes()}</b></span>
			</div>
			<div class='grid-frame' data-tree-demo>
				<TreeList
					fill
					rows={rows()}
					getRowKey={(row) => row.id}
					getParentKey={(row) => row.parentId}
					columns={TREE_COLUMNS}
					selectable={selectable()}
					loading={loading()}
					total={rows().length}
					pageSize={Math.max(rows().length, 1)}
					onRefresh={() => setRefreshes((count) => count + 1)}
					aria-label='Документы'
				/>
			</div>
		</div>
	);
}
