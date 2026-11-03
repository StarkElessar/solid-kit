import type { GridLevelLabels } from './grid-level-labels';

/** Тексты UI группировки; переопределяются через `groupingLabels` грида. */
export interface GridGroupingLabels extends GridLevelLabels {
	/** Имя панели группировки для читалок. */
	panel: string;
	/** Подсказка пустой панели. */
	hint: string;
	/** Подпись кнопки «×» чипа. */
	remove: (title: string) => string;
	/** Подпись чипа: клик меняет порядок групп колонки. */
	groupSort: (title: string, direction: 'asc' | 'desc') => string;
	/** Число строк группы в заголовке: «Всего: 3». */
	groupCount: (count: number) => string;
	/** Значение группы без текста. */
	emptyValue: string;
	/** Пункт меню колонки. */
	group: string;
	/** Пункт меню колонки, уже стоящей в группировке. */
	ungroup: string;
}
