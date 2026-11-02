import styles from './grid.module.css';

import { type JSX, Show } from 'solid-js';

import { Button } from '../button';

import { useGrid } from './grid-context';

/** Блок «пусто» вместо строк: текст, подсказка и кнопка сброса фильтров (только если страница передала `onEmptyReset`). */
export function GridEmpty(): JSX.Element {
	const grid = useGrid();
	return (
		<tr class={styles['empty-row']}>
			<td class={styles['empty-cell']} colSpan={grid.columnCount()}>
				<div class={styles['empty']}>
					<p class={styles['empty-text']}>{grid.emptyText()}</p>
					<Show when={grid.emptyHint()}>
						<div class={styles['empty-hint']}>{grid.emptyHint()}</div>
					</Show>
					<Show when={grid.onEmptyReset()} keyed>
						{(reset) => (
							<Button variant='tinted' onClick={reset}>
								{grid.emptyResetLabel()}
							</Button>
						)}
					</Show>
				</div>
			</td>
		</tr>
	);
}
