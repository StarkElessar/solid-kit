import type { ContextMenuPoint } from '../context-menu';
import type { MenuOpenSource } from '../context-menu/context-menu-context';

/** Открытое контекстное меню строки: строка запоминается в момент открытия, дальнейшие смены `rows` меню не перестраивают. */
export interface RowMenuTarget {
	point: ContextMenuPoint;
	source: MenuOpenSource;
	row: unknown;
}
