import type { MenuOpenSource } from '../context-menu/context-menu-context';

/** Открытое меню колонки: колонка и кнопка-якорь запоминаются в момент открытия. */
export interface ColumnMenuTarget {
	columnId: string;
	anchor: HTMLElement;
	source: MenuOpenSource;
}
