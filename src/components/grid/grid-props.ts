import type { JSX } from 'solid-js';

import type { GridColumn } from './grid-column';
import type { GridColumnMenuLabels } from './grid-column-menu-labels';
import type { GridPagerProps } from './grid-pager-props';
import type { GridSort } from './grid-sort';
import type { RowKey } from './row-key';

/** Пропсы Grid, добавленные по частям этапа 4а: часть 2 это данные, колонки, ширины и виртуализация. */
export interface GridProps<T> extends GridPagerProps {
	rows: readonly T[];
	/** Уникальный и стабильный между загрузками ключ строки. */
	getRowKey: (row: T) => RowKey;
	columns: readonly GridColumn<T>[];
	/** Колонка чекбоксов: первая, всегда закреплённая; клик по строке переключает выбор. */
	selectable?: boolean | undefined;
	selectedKeys?: ReadonlySet<RowKey> | undefined;
	defaultSelectedKeys?: ReadonlySet<RowKey> | undefined;
	/** Новый `Set` на каждое изменение; прежний не мутируется. Выбор не сбрасывается при смене `rows`. */
	onSelectedKeysChange?: ((keys: ReadonlySet<RowKey>) => void) | undefined;
	/** Сортировка только отображается и сообщается наружу: строки грид не сортирует. */
	sort?: GridSort | null | undefined;
	defaultSort?: GridSort | null | undefined;
	/** По клику на заголовок сортируемой колонки: цикл `asc → desc → null`, смена колонки начинает с `asc`. */
	onSortChange?: ((sort: GridSort | null) => void) | undefined;
	/** Двойной клик по неинтерактивной части строки; выбор при этом не откатывается (раздел 7 спека). */
	onRowDoubleClick?: ((row: T) => void) | undefined;
	/** Пункты контекстного меню строки (`ContextMenu.Item`, `Sub`, `Separator`): правый клик, Shift+F10 и клавиша ContextMenu. */
	rowContextMenu?: ((row: T) => JSX.Element) | undefined;
	/** Подпись главного чекбокса ('Выбрать все строки'). */
	selectAllLabel?: string | undefined;
	/** Подпись чекбокса строки ('Выбрать строку'). */
	selectRowLabel?: string | undefined;
	columnWidths?: Readonly<Record<string, number>> | undefined;
	defaultColumnWidths?: Readonly<Record<string, number>> | undefined;
	/** Один раз по окончании ресайза; в аргументе полный словарь переопределённых ширин. */
	onColumnWidthsChange?: ((widths: Readonly<Record<string, number>>) => void) | undefined;
	/** Скрытые колонки по id. Без пропса состояние стартует из `GridColumn.hidden` и дальше живёт в гриде. */
	hiddenColumns?: ReadonlySet<string> | undefined;
	defaultHiddenColumns?: ReadonlySet<string> | undefined;
	/** На каждое изменение из меню колонки; новый `Set`, прежний не мутируется. */
	onHiddenColumnsChange?: ((hidden: ReadonlySet<string>) => void) | undefined;
	/** Закреплённые колонки по id. Без пропса состояние стартует из `GridColumn.locked`. */
	lockedColumns?: ReadonlySet<string> | undefined;
	defaultLockedColumns?: ReadonlySet<string> | undefined;
	onLockedColumnsChange?: ((locked: ReadonlySet<string>) => void) | undefined;
	/** Один раз при закрытии меню колонки, если набор видимых колонок изменился; id в порядке `columns`. */
	onColumnMenuClose?: ((visibleIds: readonly string[]) => void) | undefined;
	/** Кнопки меню колонки в шапке (по умолчанию `true`). */
	columnMenu?: boolean | undefined;
	columnMenuLabels?: Partial<GridColumnMenuLabels> | undefined;
	/** Идёт загрузка: тело заменено заглушками, корень получает `aria-busy`, главный чекбокс и ручки ресайза отключены. */
	loading?: boolean | undefined;
	/** Имя полосы прогресса ('Загрузка'). */
	loadingLabel?: string | undefined;
	/** Текст состояния «пусто» ('Ничего не найдено'). */
	emptyText?: string | undefined;
	emptyHint?: JSX.Element;
	/** Кнопка сброса в состоянии «пусто» показывается только если колбэк передан. */
	onEmptyReset?: (() => void) | undefined;
	/** Подпись кнопки сброса ('Сбросить фильтры'). */
	emptyResetLabel?: string | undefined;
	/** Объявление результата после окончания загрузки ('Найдено N записей' с русским склонением). */
	foundText?: ((count: number) => string) | undefined;
	/** Стартовая оценка высоты строки, px; по умолчанию высота контрола. */
	rowHeight?: number | undefined;
	/** Сколько строк рендерить за пределами видимой области (12). */
	overscan?: number | undefined;
	/** `false` рендерит все строки подряд (читается один раз). */
	virtualized?: boolean | undefined;
	'aria-label'?: string | undefined;
	class?: string | undefined;
	style?: JSX.CSSProperties | undefined;
}
