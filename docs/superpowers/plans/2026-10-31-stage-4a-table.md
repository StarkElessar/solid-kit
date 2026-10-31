# Этап 4а, часть 2: корпус, таблица, колонки, виртуализация, ресайз, закрепление. План реализации

> **Для исполнителя:** шаги отмечены чекбоксами (`- [ ]`). Задачи выполняются по порядку; в задачах с кодом сначала красный тест, потом реализация, потом `pnpm check` (код возврата проверяется отдельной командой) и коммит. Раскладочное поведение (sticky, ресайз, `scrollMargin`) в jsdom не проверяется: его проверяют задачи 6–7 в Chrome.

**Цель:** первый видимый Grid: карточка с рамкой, закреплённая шапка, виртуализированное тело на 100 000 строк, колонки из `GridColumn`, закреплённые колонки, ресайз колонок без перерисовки строк, минимальная страница «Грид» в playground для проверки в браузере.

**Архитектура:** `Grid` собирает раскладку (`computeColumnLayout` из части 1), кладёт её в CSS-переменные на `<table>` и строит `<colgroup>` из этих переменных. Тело это окно рендера (`createVirtualWindow`, `scrollMargin` = высота шапки) с двумя spacer-строками. Ресайз во время перетаскивания пишет только CSS-переменные в DOM (`start-column-resize.ts`), в состояние Solid ширина попадает один раз на `pointerup`.

**Стек:** Solid 1.9, `@tanstack/solid-virtual`, CSS Modules, vitest 5 (jsdom), Chrome для раскладки.

**Спек:** `docs/superpowers/specs/2026-10-31-stage-4a-grid-core-design.md` (разделы 2, 4, 5, 9, 11, 12), части 1: `…-stage-4a-pure-functions.md`.

## Глобальные ограничения

- Репозиторий публичный: ни ключей, ни токенов, ни `.env`, ни корпоративной почты в коммитах.
- Один компонент/функция — один файл (kebab-case).
- ESLint: табы, одинарные кавычки, длина строки ≤ 140 вместе с комментариями, без комментариев в конце строки, `solid/reactivity`, `no-base-to-string`, `restrict-template-expressions`, `exactOptionalPropertyTypes`. Stylelint: `outline: none/0` запрещён, классы kebab-case, `--s-kit-control-height` всегда с фолбэком, литералов цвета нет.
- Пропсы не деструктурируются (`splitProps`, геттеры). Публичные тексты по умолчанию русские.
- pnpm запускается как `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`; dev-сервер playground на порту 5173 не трогать, в Chrome закрывать открытые вкладки.
- Тег не ставится и ничего не пушится без отдельного слова владельца.

## Состав части и решения

В `GridProps` этой части входят: `rows`, `getRowKey`, `columns`, `columnWidths` / `defaultColumnWidths` / `onColumnWidthsChange`, `rowHeight`, `overscan`, `virtualized`, `aria-label`, `class`, `style`. Остальные пропсы спека (сортировка, выбор, меню, состояния) добавляют части 3–4; `selectable` в этой части не существует, колонки чекбоксов нет (`computeColumnLayout` вызывается с `selectable: false`).

1. **Устройство DOM.** Корень `div[data-s-kit][data-s-kit-focus-inset][tabindex="-1"]` > скроллер `div` (`overflow: auto`) > `<table>` > `<colgroup>`, `<thead>`, `<tbody>`. Скроллер единственный, шапка и закреплённые колонки sticky внутри него.
2. **Переменные раскладки** (`layoutCssVars`) кладутся в `style` таблицы одним объектом; `<col>` читает `width: var(--s-kit-grid-w-<i>)`, у последней видимой колонки `<col>` без ширины (добор остатка, спек 4.2). Таблица `inline-size: 100%`, `min-inline-size: var(--s-kit-grid-table-w)`.
3. **Высота шапки** измеряется `ResizeObserver`-ом на `<thead>` (если он есть в окружении) и читается при монтировании; она же `scrollMargin` и `scrollPaddingStart` окна рендера и `scroll-padding-block-start` скроллера. `scroll-padding-inline-start` скроллера равен `layout.stickyWidth`.
4. **Строки.** `<tr data-index data-row-key aria-rowindex>`; `aria-rowcount = rows.length + 1`, шапка `aria-rowindex="1"`, строки `index + 2`. Ячейка без `cell` показывает `formatCellValue(value(row))`.
5. **Spacer-строки** `<tr aria-hidden="true">` с одной `<td colspan>` высотой `window.items()[0].start` сверху и `totalSize − (last.start + last.size)` снизу; при нулевой высоте не рендерятся. `virtualized={false}` берёт `createFullWindow`.
6. **Sticky.** Закреплённая ячейка (`th` и `td`): `position: sticky`, `inset-inline-start: var(--s-kit-grid-left-<i>)`, атрибут `data-sticky`; у последней закреплённой `data-sticky-last` (заметный правый разделитель). Фон sticky-ячеек непрозрачный: `--s-kit-grid-bg`.
7. **Ресайз.** Ручка на правом краю `th`; во время перетаскивания меняются только переменные на таблице; `onColumnWidthsChange` вызывается один раз на `pointerup` с полным словарём переопределений; двойной клик по ручке убирает ширину колонки из словаря (возврат к `GridColumn.width`); Esc во время перетаскивания возвращает прежние переменные и ничего не сообщает. Направление письма слева направо; RTL вне объёма.

---

### Task 1: `formatCellValue`

**Файлы:**
- Создать: `src/components/grid/format-cell-value.ts`, `src/components/grid/format-cell-value.test.ts`

**Интерфейсы:**
- Производит: `formatCellValue(value: unknown): string` — `null` и `undefined` дают `''`; строка, число, `bigint`, булево приводятся `String(value)`; `Date` даёт `toISOString()`; остальное (объекты, функции, символы) даёт `''`: показывать их должна функция `cell` колонки, строка `[object Object]` в ячейке всегда ошибка.

- [ ] Тесты: каждая ветка, `0` и `false` не превращаются в пустую строку, `NaN` даёт `'NaN'`, объект даёт `''`.
- [ ] Реализация, `pnpm check`, коммит.

### Task 2: `startColumnResize`

**Файлы:**
- Создать: `src/components/grid/start-column-resize.ts`, `src/components/grid/start-column-resize.test.ts`

**Интерфейсы:**
- Потребляет: `clampColumnWidth`.
- Производит:

```ts
export interface ColumnResizeParams {
  handle: HTMLElement;            // элемент ручки: на нём захват указателя и слушатели
  pointerId: number;
  startX: number;                 // clientX при pointerdown
  startWidth: number;             // px
  minWidth: number;               // px
  onMove: (width: number) => void;     // во время перетаскивания, ширина уже зажата
  onCommit: (width: number) => void;   // один раз на pointerup
  onCancel: () => void;                // Esc или pointercancel
}
/** Начинает перетаскивание; возвращает функцию принудительной отмены (размонтирование). */
export function startColumnResize(params: ColumnResizeParams): () => void;
```

Поведение: `setPointerCapture` вызывается через `?.` (в jsdom его нет); `pointermove` на `handle` считает `clampColumnWidth(startWidth + (clientX − startX), minWidth)` и зовёт `onMove`, только если ширина изменилась; `pointerup` зовёт `onCommit(последняя ширина)` один раз (даже если ширина не менялась: `onCommit(startWidth)`), снимает слушатели; `pointercancel` и `keydown` Escape на `document` зовут `onCancel`, снимают слушатели и не зовут `onCommit`; повторные события после завершения игнорируются; возвращаемая функция отмены делает то же, что Esc.

- [ ] Тесты (события создаются как `MouseEvent` с типами `pointermove`/`pointerup`/`pointercancel` и `clientX`): движение вправо и влево, зажим по `minWidth`, `onMove` не зовётся при неизменной ширине, один `onCommit` на `pointerup`, `onCommit(startWidth)` без движения, Esc и `pointercancel` дают `onCancel` без `onCommit`, после завершения слушатели сняты (новый `pointermove` ничего не вызывает), функция отмены.
- [ ] Реализация, `pnpm check`, коммит.

### Task 3: корпус, шапка, колонки и тело без виртуализации

**Файлы:**
- Создать: `src/components/grid/grid-props.ts`, `src/components/grid/grid-context.ts`, `src/components/grid/grid.module.css`, `src/components/grid/grid.tsx`, `src/components/grid/grid-table.tsx`, `src/components/grid/grid-colgroup.tsx`, `src/components/grid/grid-header.tsx`, `src/components/grid/grid-header-cell.tsx`, `src/components/grid/grid-body.tsx`, `src/components/grid/grid-row.tsx`, `src/components/grid/grid-cell.tsx`, `src/components/grid/index.ts`, `src/components/grid/grid.test.tsx`

**Интерфейсы:**
- Потребляет: `computeColumnLayout`, `layoutCssVars`, `widthVar`, `leftVar`, `formatCellValue`, `buildRowIndex`, `createControllableSignal`.
- Производит:

```ts
export interface GridProps<T> {
  rows: readonly T[];
  getRowKey: (row: T) => RowKey;
  columns: readonly GridColumn<T>[];
  columnWidths?: Readonly<Record<string, number>> | undefined;
  defaultColumnWidths?: Readonly<Record<string, number>> | undefined;
  onColumnWidthsChange?: ((widths: Readonly<Record<string, number>>) => void) | undefined;
  rowHeight?: number | undefined;
  overscan?: number | undefined;
  virtualized?: boolean | undefined;
  'aria-label'?: string | undefined;
  class?: string | undefined;
  style?: JSX.CSSProperties | undefined;
}
export function Grid<T>(props: GridProps<T>): JSX.Element;
```

`GridContext` отдаёт `layout` (мемо `ColumnLayout<T>`), `rowIndex` (`RowIndex`), `window` (`RenderWindow`), `getRow(index)`, `setColumnWidth`-колбэки для ресайза (подключаются в задаче 5). Контекст не экспортируется из `index.ts`; экспортируются `Grid`, типы `GridProps`, `GridColumn`, `GridSort`, `RowKey`.

- [ ] Тесты на `virtualized={false}` (все строки в DOM): корень имеет `data-s-kit`, `data-s-kit-focus-inset`, `tabindex="-1"`, `aria-label`; число `<col>` равно числу видимых колонок, у последней нет `style.width`, у остальных `width: var(--s-kit-grid-w-<i>)`; на `<table>` стоят переменные `--s-kit-grid-w-<i>`, `--s-kit-grid-table-w`, `--s-kit-grid-left-<i>` только у закреплённых; `<th>` в порядке «закреплённые первыми», скрытая колонка не рендерится; `<td>` показывает `formatCellValue(value)` или результат `cell`; закреплённые ячейки имеют `data-sticky`, последняя `data-sticky-last`, `inset-inline-start: var(--s-kit-grid-left-<i>)`; `aria-rowcount`, `aria-rowindex`, `data-index`, `data-row-key`; ширина из `columnWidths` попадает в переменную; смена `rows` обновляет тело.
- [ ] Реализация (окно рендера пока `createFullWindow`), CSS по разделу 11 спека (токены `--s-kit-grid-bg`, `-border`, `-radius`, `-header-bg`, `-max-height`, слои `--s-kit-grid-z-*` внутри компонента).
- [ ] `pnpm check`, коммит.

### Task 4: виртуализация, `scrollMargin`, spacer-строки

**Файлы:**
- Изменить: `src/components/grid/grid.tsx`, `src/components/grid/grid-body.tsx`, `src/components/grid/grid.test.tsx`

**Интерфейсы:**
- Потребляет: `createVirtualWindow`, `createFullWindow` (опции `scrollMargin`, `scrollPaddingStart`, `initialHeight`), `readControlHeight`.
- Производит: окно строится по `props.virtualized === false` (читается один раз); оценка высоты — `rowHeight`, иначе `readControlHeight(scroller)`; `overscan` по умолчанию 12; `headerHeight` сигнал (измерение при монтировании и `ResizeObserver` на `<thead>`, если он определён); `scroll-padding-block-start` и `scroll-padding-inline-start` скроллера.

- [ ] Тесты (в jsdom высота окна подменяется `vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get')`, ширина скроллера аналогично): при 1000 строк и окне 100 px рендерится не больше окна плюс `overscan` строк, есть верхний и нижний spacer с `aria-hidden`, сумма высот spacer и строк равна `totalSize`; при `virtualized={false}` spacer нет; смена `rows` меняет число строк; `scroll-padding-inline-start` скроллера равен `stickyWidth`.
- [ ] Реализация, `pnpm check`, коммит.

### Task 5: ручка ресайза и состояние ширин

**Файлы:**
- Создать: `src/components/grid/grid-resize-handle.tsx`
- Изменить: `src/components/grid/grid.tsx`, `src/components/grid/grid-header-cell.tsx`, `src/components/grid/grid-context.ts`, `src/components/grid/grid.module.css`, `src/components/grid/grid.test.tsx`

**Интерфейсы:**
- Потребляет: `startColumnResize`, `computeColumnLayout`, `layoutCssVars`, `clampColumnWidth`.
- Производит: ручка `<span role="separator" aria-orientation="vertical" data-grid-resize>` в каждом `th` (зона касания 8 px, `cursor: col-resize`, `touch-action: none`, не в Tab-порядке); `GridContext.beginResize(item: LayoutColumn<T>, event: PointerEvent)`, `GridContext.resetWidth(columnId)`; ширины колонок живут в `createControllableSignal<Record<string, number>>` (по умолчанию `{}`), во время перетаскивания `onMove` пересчитывает раскладку со словарём `{ ...widths(), [id]: width }` и пишет `layoutCssVars` прямо в `table.style` через `setProperty`; `onCommit` пишет ширину в состояние один раз и вызывает `onColumnWidthsChange`; `onCancel` возвращает переменные из текущего состояния; двойной клик по ручке удаляет ключ колонки из словаря и сообщает наружу.

- [ ] Тесты: серия `pointermove` меняет `--s-kit-grid-w-<i>` и `--s-kit-grid-table-w` на таблице (и `--s-kit-grid-left-<j>` закреплённых правее) **без вызовов `cell` и `value`** (счётчики на `vi.fn` не растут) и без вызова `onColumnWidthsChange`; `pointerup` вызывает его ровно один раз с полным словарём; Esc возвращает прежние переменные и колбэк не зовётся; ширина зажимается по `minWidth`; двойной клик возвращает исходную ширину и сообщает словарь без этой колонки; в controlled-режиме переменные после `pointerup` берутся из пропа (если родитель не обновил проп, возвращается прежняя ширина).
- [ ] Реализация, `pnpm check`, коммит.

### Task 6: минимальная страница «Грид» в playground

**Файлы:**
- Создать: `playground/src/demo-grid.tsx`, `playground/src/grid-page.tsx`, `playground/src/grid-checks.ts`
- Изменить: `playground/src/app.tsx` (страница `grid` в `PAGE_IDS` и `PAGES`), `playground/src/playground.css`

**Интерфейсы:**
- Производит: `DemoGrid()` с генератором строк без сети (запись `{ id, name, team, status, amount, city, … }`, 100 000 строк) и 12 колонками, из них две закреплённые (`locked`), одна колонка с переносом текста, одна с кастомной `cell`; переключатель числа строк (10, 1 000, 100 000), переключатель `virtualized`, показ последней записи `onColumnWidthsChange`; `runGridChecks(page): Promise<CheckResult[]>` и страница с темой и кнопкой «Запустить проверки» по образцу «Списков».
- Проверки `runGridChecks`: (1) число `<tr>` тела не больше окна плюс overscan при 100 000 строк; (2) сумма ширин `<col>` равна `table.offsetWidth` при таблице шире контейнера, а при таблице уже контейнера последняя колонка занимает остаток; (3) у закреплённых ячеек `getBoundingClientRect().left` равен `scroller.left + left`, пока скроллер прокручен вправо на ширину колонки; (4) между соседними sticky-ячейками нет зазора и наложения; (5) синтетический ресайз: серия `pointermove` меняет ширину `<col>` и `th`, число `<tr>` и тексты ячеек не меняются, `MutationObserver` на `<tbody>` не видит записей за время перетаскивания; (6) двойной клик возвращает ширину; (7) `scrollMargin`: после `scrollToIndex`-аналога (программная прокрутка к строке 50 000) первая видимая строка не прячется под шапкой.

- [ ] Реализация без тестов vitest (playground проверяется в браузере), `pnpm check`, коммит.

### Task 7: приёмка части в Chrome

- [ ] Запустить `#grid` на dev-сервере (порт 5173), автопроверки зелёные в обеих темах и после смены `data-s-kit-size`.
- [ ] Настоящими действиями: прокрутка колёсиком по вертикали и горизонтали с закреплёнными колонками (без наложений и зазоров), ресайз закреплённой и обычной колонок мышью (строки не мигают, шапка и тело двигаются вместе), двойной клик по ручке, Esc во время перетаскивания, длинный текст в ячейке обрезается или переносится, не раздвигая колонку.
- [ ] Production-сборка playground (`vite build --outDir <scratchpad> --emptyOutDir`, статический сервер на другом порту, остановка по PID после проверки cwd): 100 000 строк × 12 колонок, равномерная прокрутка 10 с, доля кадров длиннее 16,7 мс, число `<tr>` в DOM; консоль без ошибок.
- [ ] Всё найденное исправить в соответствующих файлах и записать в итоги.

### Task 8: итоги части

- [ ] `pnpm check` (число тестов выросло) и `scripts/verify-package-form.sh HEAD` (теперь подпуть `grid` существует; код возврата и число OK записать).
- [ ] В спеке этапа 4а строка 2 таблицы частей «выполнена», раздел «Итоги части 2» (расхождения, число тестов, что проверено в Chrome, что нет).
- [ ] Коммит. Тег и push не делаются.
