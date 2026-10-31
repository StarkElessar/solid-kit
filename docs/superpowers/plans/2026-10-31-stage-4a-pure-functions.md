# Этап 4а, часть 1: чистые функции, типы, `scrollMargin` окна рендера. План реализации

> **Для исполнителя:** шаги отмечены чекбоксами (`- [ ]`). Задачи выполняются по порядку, в каждой сначала тест (красный), потом код (зелёный), потом `pnpm check` и коммит. Код возврата `pnpm check` проверяется отдельной командой.

**Цель:** построить без DOM и без компонентов всё, что нужно таблице грида (части 2–4): типы колонок и сортировки, расчёт ширин и смещений закреплённых колонок, имена CSS-переменных, цикл сортировки, состояние выбора, определение интерактивной цели клика и индекс «ключ ↔ строка»; расширить окно рендера смещением списка (`scrollMargin`).

**Архитектура:** каждая функция чистая и лежит в своём файле (один класс/функция — один файл), тесты рядом. Компонентов нет. Расчёт раскладки отдаёт данные, а CSS-переменные формируются отдельной функцией: часть 2 пишет их в `style` таблицы, а ресайз (часть 2) пересчитывает раскладку с новой шириной и пишет те же переменные прямо в DOM.

**Стек:** TypeScript 5.9 (`exactOptionalPropertyTypes`, `erasableSyntaxOnly`), vitest 5 (jsdom), `@tanstack/solid-virtual`.

**Спек:** `docs/superpowers/specs/2026-10-31-stage-4a-grid-core-design.md` (разделы 2, 4.2, 4.3, 5, 6, 7, 12).

## Глобальные ограничения

- Репозиторий публичный: ни ключей, ни токенов, ни `.env`, ни корпоративной почты в коммитах.
- Один класс/функция — один файл (kebab-case); связанные модули импортируют друг друга.
- ESLint: табы, одинарные кавычки, длина строки ≤ 140 вместе с комментариями, без комментариев в конце строки. `exactOptionalPropertyTypes`: у необязательных свойств тип `| undefined`.
- Тесты не мутируют входные данные; функции возвращают новые значения (`Set`, объекты) и не меняют аргументы.
- pnpm запускается как `env -u HTTPS_PROXY -u HTTP_PROXY -u https_proxy -u http_proxy pnpm …`.
- Тег не ставится и ничего не пушится без отдельного слова владельца.

## Решения

1. Индекс колонки `i` в именах CSS-переменных это индекс среди видимых упорядоченных колонок **без** колонки чекбоксов; у колонки чекбоксов ширина константа (`--s-kit-grid-select-width`), своей переменной нет.
2. `GridColumn.width` по умолчанию 160, `minWidth` по умолчанию 60; ширина колонки это `max(minWidth, widths[id] ?? width ?? 160)`.
3. `RenderWindowItem.start` остаётся отсчётом от начала списка: реализация на TanStack вычитает `scrollMargin` из `start` элементов, потребители (ListBox) не меняются.
4. `GridProps` (тип пропсов с JSX) в этой части не создаётся: он нужен компоненту (часть 2); здесь только типы данных.

---

### Task 1: `scrollMargin` в окне рендера

**Файлы:**
- Изменить: `src/utils/render-window.ts`, `src/utils/create-virtual-window.ts`, `src/utils/create-full-window.ts` (только комментарий), `src/utils/create-virtual-window.test.tsx`

**Интерфейсы:**
- Производит: `RenderWindowOptions.scrollMargin?: Accessor<number> | undefined` — расстояние от начала скроллера до начала списка, px (у грида высота липкой шапки). `RenderWindowItem.start` и `totalSize()` по-прежнему отсчитываются от начала списка.

- [ ] Тест (красный): при `scrollMargin: () => 60`, высоте окна 100, строке 20, `overscan: 0` и `scrollTop = 0` в `items()` первая строка имеет `start === 0`, а `totalSize()` равен `count * 20`; при `scrollTop = 60` первая видимая строка по-прежнему индекс 0 (шапка вышла за край, список начался); без `scrollMargin` поведение прежнее (существующие тесты не меняются).
- [ ] Реализация: геттер `scrollMargin` в опциях `createVirtualizer`; `items()` отдаёт `start: item.start - margin`.
- [ ] `createFullWindow`: в комментарии записать, что `scrollMargin` игнорируется (все строки в DOM).
- [ ] `pnpm check`, коммит.

### Task 2: типы грида

**Файлы:**
- Создать: `src/components/grid/row-key.ts`, `src/components/grid/grid-sort.ts`, `src/components/grid/grid-column.ts`

**Интерфейсы:**
- Производит: `type RowKey = string | number`; `interface GridSort { columnId: string; direction: 'asc' | 'desc' }`; `interface GridColumn<T>` (поля как в спеке, раздел 2: `id`, `title`, `value`, `cell?`, `width?`, `minWidth?`, `align?`, `locked?`, `hidden?`, `sortable?`; необязательные с `| undefined`).

- [ ] Файлы только с типами; проверяются `tsc` (отдельного теста нет, они используются тестами задач 3–8).
- [ ] Коммит вместе с Task 3 (типов без потребителя в одиночку не фиксируем).

### Task 3: `clampColumnWidth`

**Файлы:**
- Создать: `src/components/grid/clamp-column-width.ts`, `src/components/grid/clamp-column-width.test.ts`

**Интерфейсы:**
- Производит: `const DEFAULT_COLUMN_WIDTH = 160`, `const DEFAULT_MIN_COLUMN_WIDTH = 60`, `clampColumnWidth(width: number, minWidth?: number): number` — не меньше `minWidth` (по умолчанию 60), нецелое округляется до целого px, нечисло (`NaN`, `Infinity`) возвращает минимум.

- [ ] Тесты: меньше минимума → минимум; ровно минимум; больше → без изменений; `59.6` при минимуме 60 → 60; `120.4` → 120; `NaN` → минимум; свой `minWidth` 100.
- [ ] Реализация, `pnpm check`, коммит (вместе с типами).

### Task 4: `computeColumnLayout` и CSS-переменные

**Файлы:**
- Создать: `src/components/grid/column-layout.ts`, `src/components/grid/column-layout.test.ts`, `src/components/grid/column-css-vars.ts`, `src/components/grid/column-css-vars.test.ts`

**Интерфейсы:**
- Потребляет: `GridColumn<T>`, `clampColumnWidth`, `DEFAULT_COLUMN_WIDTH`.
- Производит (`column-layout.ts`):

```ts
export interface LayoutColumn<T> {
  readonly column: GridColumn<T>;
  readonly index: number;      // среди видимых упорядоченных, без колонки чекбоксов
  readonly width: number;      // px
  readonly sticky: boolean;    // column.locked === true
  readonly left: number;       // смещение для sticky (с учётом колонки чекбоксов); у обычных 0
}
export interface ColumnLayout<T> {
  readonly columns: readonly LayoutColumn<T>[];
  readonly selectWidth: number;  // 0, если колонки чекбоксов нет
  readonly tableWidth: number;   // сумма ширин колонок плюс selectWidth
  readonly stickyWidth: number;  // selectWidth плюс ширины sticky-колонок
}
export function computeColumnLayout<T>(
  columns: readonly GridColumn<T>[],
  widths: Readonly<Record<string, number>>,
  options: { selectable: boolean; selectWidth: number }
): ColumnLayout<T>;
```

- Производит (`column-css-vars.ts`):

```ts
export const TABLE_WIDTH_VAR = '--s-kit-grid-table-w';
export function widthVar(index: number): string;   // '--s-kit-grid-w-3'
export function leftVar(index: number): string;    // '--s-kit-grid-left-3'
export function layoutCssVars<T>(layout: ColumnLayout<T>): Readonly<Record<string, string>>;
// { '--s-kit-grid-table-w': '1240px', '--s-kit-grid-w-0': '160px', …, '--s-kit-grid-left-0': '44px' для sticky }
```

- [ ] Тесты раскладки: скрытые (`hidden`) пропускаются; закреплённые идут первыми внутри своей группы в порядке массива; индексы сквозные после перестановки; ширина `widths[id]` важнее `width`, `width` важнее 160, результат не меньше `minWidth` (по умолчанию 60); `left` первой sticky-колонки равен `selectWidth`, следующей `selectWidth + ширина первой`; у обычных `left === 0`; `tableWidth` включает `selectWidth`; при `selectable: false` `selectWidth === 0`; пустой список колонок даёт нули.
- [ ] Тесты переменных: имена; значения с `px`; `leftVar` только у sticky-колонок; `TABLE_WIDTH_VAR` равен `tableWidth`.
- [ ] Реализация, `pnpm check`, коммит.

### Task 5: `nextSort`

**Файлы:**
- Создать: `src/components/grid/next-sort.ts`, `src/components/grid/next-sort.test.ts`

**Интерфейсы:**
- Производит: `nextSort(current: GridSort | null, columnId: string): GridSort | null` — цикл `asc → desc → null` для той же колонки; другая колонка или `null` начинают с `asc`.

- [ ] Тесты: `null` → `asc`; `asc` той же → `desc`; `desc` той же → `null`; активна другая колонка → `asc` новой; результат не тот же объект, что вход.
- [ ] Реализация, `pnpm check`, коммит.

### Task 6: состояние выбора

**Файлы:**
- Создать: `src/components/grid/selection-state.ts`, `src/components/grid/selection-state.test.ts`

**Интерфейсы:**
- Потребляет: `RowKey`.
- Производит:

```ts
export type SelectionState = 'none' | 'some' | 'all';
export function toggleKey(keys: ReadonlySet<RowKey>, key: RowKey): ReadonlySet<RowKey>;
export function selectAllKeys(keys: ReadonlySet<RowKey>, loaded: readonly RowKey[]): ReadonlySet<RowKey>;
export function clearKeys(keys: ReadonlySet<RowKey>, loaded: readonly RowKey[]): ReadonlySet<RowKey>;
export function selectionOf(keys: ReadonlySet<RowKey>, loaded: readonly RowKey[]): SelectionState;
```

Все функции возвращают новый `Set`, вход не мутируют. `clearKeys` убирает только ключи загруженных строк, ключи прошлых загрузок остаются (спек, раздел 7). `selectionOf` считает только по `loaded`: пустой `loaded` даёт `'none'`.

- [ ] Тесты: `toggleKey` добавляет и убирает, вход не меняется; `selectAllKeys` добавляет все загруженные и сохраняет чужие ключи; `clearKeys` убирает загруженные и сохраняет чужие; `selectionOf`: пусто / часть / все, чужие ключи не влияют, пустой `loaded`.
- [ ] Реализация, `pnpm check`, коммит.

### Task 7: `isInteractiveTarget`

**Файлы:**
- Создать: `src/components/grid/is-interactive-target.ts`, `src/components/grid/is-interactive-target.test.ts`

**Интерфейсы:**
- Производит: `isInteractiveTarget(target: EventTarget | null, row: Element): boolean` — `true`, если от `target` вверх до `row` (не включая `row`) встретился `button`, `a[href]`, `input`, `select`, `textarea`, `summary`, `label`, `[role="button"]`, `[role="combobox"]`, `[role="menuitem"]`, `[role="option"]`, `[contenteditable]` или `[data-grid-no-select]`; нецелевые типы (`null`, текстовый узел) обрабатываются без ошибки.

- [ ] Тесты: ячейка с текстом → `false`; `button` внутри ячейки и клик по вложенному `span` в нём → `true`; `a` без `href` → `false`, `a[href]` → `true`; `[role="combobox"]` (инпут Select) → `true`; `[data-grid-no-select]` на предке → `true`; целевой элемент вне `row` (панель, смонтированная в корень) → `true` (защита: событие чужого поддерева не должно выбирать строку); `target === null` → `true`.
- [ ] Реализация, `pnpm check`, коммит.

### Task 8: индекс строк по ключу

**Файлы:**
- Создать: `src/components/grid/build-row-index.ts`, `src/components/grid/build-row-index.test.ts`

**Интерфейсы:**
- Производит: `buildRowIndex<T>(rows: readonly T[], getRowKey: (row: T) => RowKey): { keys: readonly RowKey[]; indexByKey: ReadonlyMap<RowKey, number> }` — `getRowKey` вызывается один раз на строку; при повторе ключа в карте остаётся индекс первой строки.

- [ ] Тесты: порядок ключей совпадает с порядком строк; `indexByKey.get(key)` даёт индекс; `getRowKey` вызван ровно `rows.length` раз (`vi.fn`); повтор ключа даёт индекс первой; пустой список.
- [ ] Реализация, `pnpm check`, коммит.

### Task 9: итог части

- [ ] `pnpm check` (число тестов выросло), `scripts/verify-package-form.sh HEAD` (проверка формы пакета не должна измениться: новых экспортов подпути `grid` ещё нет).
- [ ] В спеке этапа 4а строка 1 таблицы частей: «выполнена», раздел «Итоги части 1» (расхождения, число тестов).
- [ ] Коммит. Тег и push не делаются.
